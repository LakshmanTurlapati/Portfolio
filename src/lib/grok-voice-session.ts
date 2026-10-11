'use client';

import {
  GROK_VOICE_SAMPLE_RATE,
  grokVoiceTools,
  type GrokVoiceFunctionTool,
} from './grok-voice-tools';

export type GrokVoiceToolCall = {
  name: string;
  callId: string;
  args: Record<string, unknown>;
};

export type GrokVoiceResponse = {
  hadAudio: boolean;
  transcript: string;
  toolCalls: GrokVoiceToolCall[];
};

export type GrokVoiceGrant = {
  token: string;
  voice: string;
  model: string;
  instructions: string;
};

type GrokVoiceHandlers = {
  onUserTranscript: (text: string) => void;
  onAssistantTranscript: (text: string) => void;
  onResponse: (response: GrokVoiceResponse) => void;
  onBargeIn: () => void;
  onError: (message: string) => void;
  onPlaybackStart: (analyser: AnalyserNode) => void;
  onPlaybackIdle: () => void;
  onMicDenied: () => void;
};

type VerbatimWaiter = {
  resolve: () => void;
  reject: (error: Error) => void;
};

const MAX_BUFFERED_AUDIO_CHUNKS = 20;

export function float32ToPcm16(samples: Float32Array): Int16Array {
  const pcm16 = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    pcm16[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }
  return pcm16;
}

export function resampleFloat32(samples: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (fromRate === toRate || samples.length === 0) return samples;
  const ratio = toRate / fromRate;
  const length = Math.max(1, Math.floor(samples.length * ratio));
  const output = new Float32Array(length);
  for (let i = 0; i < length; i += 1) {
    const position = i / ratio;
    const index = Math.min(samples.length - 1, Math.floor(position));
    const next = Math.min(samples.length - 1, index + 1);
    const fraction = position - index;
    output[i] = samples[index] * (1 - fraction) + samples[next] * fraction;
  }
  return output;
}

export function downsampleFloat32(samples: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (fromRate <= toRate) return samples;
  return resampleFloat32(samples, fromRate, toRate);
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const stride = 0x8000;
  for (let i = 0; i < bytes.length; i += stride) {
    const slice = bytes.subarray(i, i + stride);
    binary += String.fromCharCode(...slice);
  }
  return btoa(binary);
}

export function base64ToPcm16(payload: string): Int16Array {
  const binary = atob(payload);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Int16Array(bytes.buffer);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {};
}

export function parseToolArguments(raw: unknown): Record<string, unknown> {
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return asRecord(parsed);
    } catch {
      return {};
    }
  }
  return asRecord(raw);
}

export class GrokVoiceSession {
  private ws: WebSocket | null = null;
  private micStream: MediaStream | null = null;
  private micNode: AudioWorkletNode | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private playbackAnalyser: AnalyserNode | null = null;
  private nextPlayTime = 0;
  private activeSources = 0;
  private liveSources: AudioBufferSourceNode[] = [];
  private playbackWaiters: Array<() => void> = [];
  private ready = false;
  private closed = false;
  private sawAudio = false;
  private assistantTranscript = '';
  private toolBuffer: GrokVoiceToolCall[] = [];
  private verbatimWaiter: VerbatimWaiter | null = null;
  private bufferedAudio: string[] = [];
  private responseTimer: ReturnType<typeof setTimeout> | null = null;

  private constructor(
    private readonly handlers: GrokVoiceHandlers,
    private readonly playbackContext: AudioContext,
    private readonly micContext: AudioContext,
  ) {}

  static async connect(
    grant: GrokVoiceGrant,
    handlers: GrokVoiceHandlers,
    playbackContext: AudioContext,
    micContext: AudioContext,
  ): Promise<GrokVoiceSession> {
    const session = new GrokVoiceSession(handlers, playbackContext, micContext);
    await session.openSocket(grant);
    return session;
  }

  sendUserText(text: string): void {
    const trimmed = text.trim();
    if (!trimmed || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.send({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text: trimmed }],
      },
    });
    this.send({ type: 'response.create' });
    this.armResponseTimer();
  }

  speakVerbatim(text: string): Promise<void> {
    const trimmed = text.trim();
    if (!trimmed) return Promise.resolve();
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error('Grok Voice is not connected'));
    }
    if (this.verbatimWaiter) {
      this.verbatimWaiter.reject(new Error('Replaced by a newer spoken line'));
      this.verbatimWaiter = null;
    }
    return new Promise<void>((resolve, reject) => {
      this.verbatimWaiter = { resolve, reject };
      this.send({
        type: 'conversation.item.create',
        item: {
          type: 'force_message',
          role: 'assistant',
          interruptible: true,
          content: [{ type: 'output_text', text: trimmed }],
        },
      });
      this.armResponseTimer();
    });
  }

  submitToolOutput(callId: string, output: unknown): void {
    this.send({
      type: 'conversation.item.create',
      item: {
        type: 'function_call_output',
        call_id: callId,
        output: JSON.stringify(output),
      },
    });
  }

  continueResponse(): void {
    this.send({ type: 'response.create' });
    this.armResponseTimer();
  }

  waitForPlayback(): Promise<void> {
    if (this.activeSources === 0) return Promise.resolve();
    return new Promise((resolve) => {
      this.playbackWaiters.push(resolve);
    });
  }

  interrupt(): void {
    this.stopPlayback();
    this.rejectVerbatim(new Error('Interrupted'));
    this.send({ type: 'response.cancel' });
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    this.clearResponseTimer();
    this.stopPlayback();
    this.rejectVerbatim(new Error('Voice session closed'));
    try { this.micNode?.disconnect(); } catch {}
    try { this.micSource?.disconnect(); } catch {}
    this.micNode = null;
    this.micSource = null;
    this.micStream?.getTracks().forEach((track) => track.stop());
    this.micStream = null;
    try { this.ws?.close(); } catch {}
    this.ws = null;
  }

  private async openSocket(grant: GrokVoiceGrant): Promise<void> {
    if (this.playbackContext.state === 'suspended') {
      try { await this.playbackContext.resume(); } catch {}
    }
    if (this.playbackContext.state === 'suspended') {
      throw new Error('AudioContext still suspended');
    }

    const url = `wss://api.x.ai/v1/realtime?model=${encodeURIComponent(grant.model)}`;
    const socket = new WebSocket(url, [`xai-client-secret.${grant.token}`]);
    this.ws = socket;

    await new Promise<void>((resolve, reject) => {
      const fail = () => reject(new Error('Grok Voice connection failed'));
      socket.addEventListener('open', () => resolve(), { once: true });
      socket.addEventListener('error', fail, { once: true });
    });

    socket.addEventListener('message', (event) => {
      if (typeof event.data !== 'string') return;
      this.handleEvent(event.data);
    });
    socket.addEventListener('close', () => {
      if (!this.closed) this.handlers.onError('Voice connection closed');
    });
    socket.addEventListener('error', () => {
      if (!this.closed) this.handlers.onError('Voice connection hiccup');
    });

    this.send(this.sessionUpdate(grant));
    window.setTimeout(() => {
      if (!this.ready && !this.closed) this.markReady();
    }, 1500);
    try {
      await this.startMicrophone();
    } catch (error) {
      const name = error instanceof DOMException ? error.name : '';
      if (name === 'NotAllowedError' || name === 'NotFoundError') {
        this.handlers.onMicDenied();
      } else {
        throw error;
      }
    }
  }

  private sessionUpdate(grant: GrokVoiceGrant): Record<string, unknown> {
    return {
      type: 'session.update',
      session: {
        voice: grant.voice,
        instructions: grant.instructions,
        reasoning: { effort: 'none' },
        turn_detection: { type: 'server_vad' },
        tools: grokVoiceTools satisfies GrokVoiceFunctionTool[],
        audio: {
          input: {
            format: { type: 'audio/pcm', rate: GROK_VOICE_SAMPLE_RATE },
            transcription: { model: 'grok-transcribe' },
          },
          output: {
            format: { type: 'audio/pcm', rate: GROK_VOICE_SAMPLE_RATE },
          },
        },
      },
    };
  }

  private async startMicrophone(): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
      },
    });
    if (this.closed) {
      stream.getTracks().forEach((track) => track.stop());
      return;
    }
    this.micStream = stream;
    if (this.micContext.state === 'suspended') {
      try { await this.micContext.resume(); } catch {}
    }
    await this.micContext.audioWorklet.addModule('/pcm-processor.js');
    const source = this.micContext.createMediaStreamSource(stream);
    const node = new AudioWorkletNode(this.micContext, 'pcm-processor');
    node.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
      const samples = new Float32Array(event.data);
      const shaped = downsampleFloat32(samples, this.micContext.sampleRate, GROK_VOICE_SAMPLE_RATE);
      const pcm = float32ToPcm16(shaped);
      const encoded = bytesToBase64(new Uint8Array(pcm.buffer));
      this.enqueueInputAudio(encoded);
    };
    source.connect(node);
    const silent = this.micContext.createGain();
    silent.gain.value = 0;
    node.connect(silent);
    silent.connect(this.micContext.destination);
    this.micSource = source;
    this.micNode = node;
  }

  private enqueueInputAudio(encoded: string): void {
    if (!this.ready) {
      this.bufferedAudio.push(encoded);
      if (this.bufferedAudio.length > MAX_BUFFERED_AUDIO_CHUNKS) {
        this.bufferedAudio.shift();
      }
      return;
    }
    this.send({ type: 'input_audio_buffer.append', audio: encoded });
  }

  private markReady(): void {
    if (this.ready || this.closed) return;
    this.ready = true;
    const queued = this.bufferedAudio.splice(0);
    for (const audio of queued) {
      this.send({ type: 'input_audio_buffer.append', audio });
    }
  }

  private handleEvent(raw: string): void {
    let event: Record<string, unknown>;
    try {
      event = asRecord(JSON.parse(raw));
    } catch {
      return;
    }
    const type = typeof event.type === 'string' ? event.type : '';

    if (type === 'session.updated' || type === 'session.created') {
      if (type === 'session.updated') this.markReady();
      return;
    }

    if (type === 'input_audio_buffer.speech_started') {
      this.stopPlayback();
      this.handlers.onBargeIn();
      return;
    }

    if (type === 'conversation.item.input_audio_transcription.updated') {
      const text = typeof event.transcript === 'string'
        ? event.transcript
        : typeof event.delta === 'string'
          ? event.delta
          : '';
      if (text.trim()) this.handlers.onUserTranscript(text);
      return;
    }

    if (type === 'response.created') {
      this.sawAudio = false;
      this.assistantTranscript = '';
      this.toolBuffer = [];
      this.clearResponseTimer();
      return;
    }

    if (type === 'response.output_audio.delta' || type === 'response.audio.delta') {
      const delta = typeof event.delta === 'string' ? event.delta : '';
    if (!delta) return;
    this.sawAudio = true;
    const pcm = base64ToPcm16(delta);
    if (pcm.length === 0) return;
    this.playPcm16(pcm);
      return;
    }

    if (
      type === 'response.output_audio_transcript.delta'
      || type === 'response.audio_transcript.delta'
    ) {
      const delta = typeof event.delta === 'string' ? event.delta : '';
      this.assistantTranscript += delta;
      if (this.assistantTranscript.trim()) this.handlers.onAssistantTranscript(this.assistantTranscript);
      return;
    }

    if (
      type === 'response.output_audio_transcript.done'
      || type === 'response.audio_transcript.done'
    ) {
      const transcript = typeof event.transcript === 'string' ? event.transcript : this.assistantTranscript;
      this.assistantTranscript = transcript;
      if (transcript.trim()) this.handlers.onAssistantTranscript(transcript);
      return;
    }

    if (type === 'response.function_call_arguments.done') {
      const name = typeof event.name === 'string' ? event.name : '';
      const callId = typeof event.call_id === 'string' ? event.call_id : '';
      if (name && callId) {
        this.toolBuffer.push({ name, callId, args: parseToolArguments(event.arguments) });
      }
      return;
    }

    if (type === 'response.done') {
      this.clearResponseTimer();
      const transcript = this.assistantTranscript.trim();
      const toolCalls = this.toolBuffer.splice(0);
      const hadAudio = this.sawAudio;
      if (this.verbatimWaiter) {
        const waiter = this.verbatimWaiter;
        this.verbatimWaiter = null;
        void this.waitForPlayback().then(() => waiter.resolve());
        return;
      }
      this.handlers.onResponse({ hadAudio, transcript, toolCalls });
      return;
    }

    if (type === 'error') {
      const nested = asRecord(event.error);
      const message = typeof nested.message === 'string'
        ? nested.message
        : typeof event.message === 'string'
          ? event.message
          : 'Voice connection hiccup';
      this.rejectVerbatim(new Error(message));
      this.handlers.onError(message);
    }
  }

  private playPcm16(pcm16: Int16Array): void {
    const ctx = this.playbackContext;
    const samples = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i += 1) samples[i] = pcm16[i] / 32768;
    const shaped = resampleFloat32(samples, GROK_VOICE_SAMPLE_RATE, ctx.sampleRate);
    const buffer = ctx.createBuffer(1, shaped.length, ctx.sampleRate);
    buffer.getChannelData(0).set(shaped);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    if (!this.playbackAnalyser) {
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.connect(ctx.destination);
      this.playbackAnalyser = analyser;
      this.handlers.onPlaybackStart(analyser);
    }
    source.connect(this.playbackAnalyser);
    const startAt = Math.max(ctx.currentTime, this.nextPlayTime);
    this.nextPlayTime = startAt + buffer.duration;
    this.activeSources += 1;
    this.liveSources.push(source);
    source.onended = () => {
      this.liveSources = this.liveSources.filter((item) => item !== source);
      this.activeSources = Math.max(0, this.activeSources - 1);
      if (this.activeSources === 0) this.flushPlaybackWaiters();
    };
    source.start(startAt);
  }

  private stopPlayback(): void {
    const sources = this.liveSources.splice(0);
    for (const source of sources) {
      try { source.onended = null; source.stop(); } catch {}
    }
    this.nextPlayTime = 0;
    this.activeSources = 0;
    if (this.playbackAnalyser) {
      try { this.playbackAnalyser.disconnect(); } catch {}
      this.playbackAnalyser = null;
    }
    this.flushPlaybackWaiters();
  }

  private flushPlaybackWaiters(): void {
    const waiters = this.playbackWaiters.splice(0);
    for (const resolve of waiters) resolve();
    this.handlers.onPlaybackIdle();
  }

  private rejectVerbatim(error: Error): void {
    if (!this.verbatimWaiter) return;
    const waiter = this.verbatimWaiter;
    this.verbatimWaiter = null;
    waiter.reject(error);
  }

  private armResponseTimer(): void {
    this.clearResponseTimer();
    this.responseTimer = setTimeout(() => {
      this.responseTimer = null;
      this.rejectVerbatim(new Error('Voice response timed out'));
      this.handlers.onError('Voice response timed out');
    }, 35000);
  }

  private clearResponseTimer(): void {
    if (this.responseTimer !== null) {
      clearTimeout(this.responseTimer);
      this.responseTimer = null;
    }
  }

  private send(payload: Record<string, unknown>): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify(payload));
  }
}

export async function fetchGrokVoiceGrant(): Promise<GrokVoiceGrant> {
  const response = await fetch('/api/voice-session', { method: 'POST' });
  if (!response.ok) throw new Error(`voice-session ${response.status}`);
  const body = await response.json() as Partial<GrokVoiceGrant>;
  if (!body.token || !body.voice || !body.model || !body.instructions) {
    throw new Error('voice-session incomplete');
  }
  return {
    token: body.token,
    voice: body.voice,
    model: body.model,
    instructions: body.instructions,
  };
}
