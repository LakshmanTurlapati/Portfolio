'use client';

// src/lib/voice-controller.ts
// Per D-05, D-06, D-18, D-19, D-20, D-21, D-22, D-23, D-24, D-25:
// Full voice session state machine — STT, ElevenLabs TTS, AI agent loop,
// voice commands, scripted tour, barge-in, persistent memory, accessibility shortcuts.

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  isStopIntent,
  TOUR_STEPS,
} from './voice-commands';
import { Scribe, RealtimeEvents, CommitStrategy } from '@elevenlabs/client';
import type { RealtimeConnection } from '@elevenlabs/client';

// ToolCallbacks carries App-level handlers for tool calls named in TOUR_STEPS and AI responses.
// All fields are optional so callers can wire only what they support this phase.
// Un-wired tools log a console.warn and are no-ops — they do NOT silently succeed.
export interface ToolCallbacks {
  openProject?: (args: { slug: string }) => void;   // Required for tour step 4 (Parz-AI)
  scrollTo?: (args: { selector: string }) => void;
  openLink?: (args: { url: string }) => void;
  toggleTheme?: () => void;
  // navigate and tourStep are handled internally by goPage / startTour; not in ToolCallbacks.
  // endCall is handled internally by close(); not in ToolCallbacks.
}

export interface VoiceControllerOptions {
  goPage: (page: string, originX?: number, originY?: number) => void;
  openTextChat: (initialText?: string) => void;
  currentPage?: string;
  toolCallbacks?: ToolCallbacks;   // per D-19: tool calls plumbed from App level
}

interface VoiceControllerResult {
  active: boolean;
  open: () => void;
  close: () => void;
  micDenied: boolean;         // true if getUserMedia was blocked (per D-25)
  prefersReduced: boolean;    // per D-24: caller can skip GSAP morph when true
  voiceProps: {
    state: string;
    caption: string;
    transcript: string;
    onMic: () => void;        // toggles listen/stop
    onStop: () => void;
    onClose: () => void;
    onFallbackChat: () => void;
  };
}

// Rolling message history entry
interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function useVoiceController({
  goPage,
  openTextChat,
  currentPage,
  toolCallbacks,
}: VoiceControllerOptions): VoiceControllerResult {

  const [active, setActive] = useState(false);
  const [voiceState, setVoiceState] = useState<string>('idle');
  const [caption, setCaption] = useState('');
  const [transcript, setTranscript] = useState('');
  const [micDenied, setMicDenied] = useState(false);

  // Detect prefers-reduced-motion once at hook init (per D-24)
  const prefersReduced =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  // Refs for non-reactive mutable state
  const connectionRef = useRef<RealtimeConnection | null>(null);
  const speakingRef = useRef(false);
  const detachMicRef = useRef<(() => void) | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const historyRef = useRef<HistoryMessage[]>([]);
  const activeRef = useRef(false);  // shadow ref to read active in callbacks

  // Keep activeRef in sync with state
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  // Subscribe to VoiceBus state events to keep local voiceState in sync
  useEffect(() => {
    if (typeof window === 'undefined' || !window.VoiceBus) return;
    const unsub = window.VoiceBus.on('state', (s) => setVoiceState(s as string));
    return unsub as () => void;
  }, []);

  // Per D-22: load voice history from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem('pf-voice-history');
      if (saved) historyRef.current = JSON.parse(saved) as HistoryMessage[];
    } catch {
      // Ignore tampered/corrupt localStorage (T-08-08: accept risk)
    }
  }, []);

  // dispatchToolCall — single dispatch point for all step.call entries and AI tool responses.
  // Per D-19: openProject is wired when toolCallbacks.openProject provided; others console.warn on miss.
  // Phase 13: emits VoiceBus 'tool-executing' before callback and 'tool-success'/'tool-error' after.
  const dispatchToolCall = useCallback(
    (name: string, args: Record<string, unknown>): void => {
      switch (name) {
        case 'openProject':
          if (toolCallbacks?.openProject) {
            if (typeof window !== 'undefined' && window.VoiceBus) window.VoiceBus.emit('tool-executing');
            toolCallbacks.openProject(args as { slug: string });
            if (typeof window !== 'undefined' && window.VoiceBus) window.VoiceBus.emit('tool-success');
          } else {
            console.warn('[VoiceController] openProject tool called but no toolCallbacks.openProject provided');
            if (typeof window !== 'undefined' && window.VoiceBus) window.VoiceBus.emit('tool-error');
          }
          break;
        case 'scrollTo':
          if (toolCallbacks?.scrollTo) {
            if (typeof window !== 'undefined' && window.VoiceBus) window.VoiceBus.emit('tool-executing');
            toolCallbacks.scrollTo(args as { selector: string });
            if (typeof window !== 'undefined' && window.VoiceBus) window.VoiceBus.emit('tool-success');
          } else {
            console.warn('[VoiceController] scrollTo tool called but no toolCallbacks.scrollTo provided');
            if (typeof window !== 'undefined' && window.VoiceBus) window.VoiceBus.emit('tool-error');
          }
          break;
        case 'openLink':
          if (toolCallbacks?.openLink) {
            if (typeof window !== 'undefined' && window.VoiceBus) window.VoiceBus.emit('tool-executing');
            toolCallbacks.openLink(args as { url: string });
            if (typeof window !== 'undefined' && window.VoiceBus) window.VoiceBus.emit('tool-success');
          } else {
            console.warn('[VoiceController] openLink tool called but no toolCallbacks.openLink provided');
            if (typeof window !== 'undefined' && window.VoiceBus) window.VoiceBus.emit('tool-error');
          }
          break;
        case 'toggleTheme':
          if (toolCallbacks?.toggleTheme) {
            if (typeof window !== 'undefined' && window.VoiceBus) window.VoiceBus.emit('tool-executing');
            toolCallbacks.toggleTheme();
            if (typeof window !== 'undefined' && window.VoiceBus) window.VoiceBus.emit('tool-success');
          } else {
            console.warn('[VoiceController] toggleTheme tool called but no toolCallbacks.toggleTheme provided');
            if (typeof window !== 'undefined' && window.VoiceBus) window.VoiceBus.emit('tool-error');
          }
          break;
        case 'navigate':
          goPage((args as { page: string }).page);
          break;
        case 'endCall':
          break;
        default:
          console.warn(`[VoiceController] Unknown tool call: ${name}`, args);
      }
    },
    [toolCallbacks, goPage]
  );

  // Phase 13 (D-08): replace hardcoded 500ms with VoiceBus 'page-ready' event wait.
  // Pages emit VoiceBus.emit('page-ready', pageName) in their mount useEffect.
  // Falls back to 1500ms if the page does not emit the event (e.g., already mounted).
  const waitForPage = useCallback((targetPage: string): Promise<void> => {
    if (typeof window === 'undefined' || !window.VoiceBus) {
      return new Promise<void>((r) => setTimeout(r, 500));
    }
    return Promise.race([
      new Promise<void>((resolve) => {
        const unsub = window.VoiceBus.on('page-ready', (page) => {
          if (page === targetPage) {
            (unsub as () => void)();
            resolve();
          }
        });
      }),
      new Promise<void>((resolve) => setTimeout(resolve, 1500)),
    ]);
  }, []);

  // stopAll — cancel all ongoing audio/speech/recognition
  const stopAll = useCallback(() => {
    try { connectionRef.current?.close(); } catch {}
    connectionRef.current = null;
    try {
      audioSourceRef.current?.stop();
      audioSourceRef.current = null;
    } catch {}
    try { window.speechSynthesis?.cancel(); } catch {}
    try {
      detachMicRef.current?.();
      detachMicRef.current = null;
    } catch {}
    window.VoiceBus._stopLoop();
    window.VoiceBus.setState('idle');
    speakingRef.current = false;
    setCaption('');
    setTranscript('');
  }, []);

  // streamTTS — ElevenLabs streaming TTS via /api/tts (per D-01, D-04)
  // Returns a Promise that resolves when audio playback ends (for tour sequencing).
  const streamTTS = useCallback(
    (text: string): Promise<void> => {
      return new Promise<void>((resolve) => {
        window.VoiceBus.setState('speaking');
        setCaption(text);

        fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, voiceId: 'dMWVPH9DSxWOMrrrUso3' }),
        })
          .then(async (res) => {
            if (!res.ok) throw new Error(`TTS fetch failed: ${res.status}`);
            const buffer = await res.arrayBuffer();
            const ctx = window.VoiceBus._getCtx();
            if (!ctx) throw new Error('AudioContext unavailable');
            const decoded = await ctx.decodeAudioData(buffer);

            const source = ctx.createBufferSource();
            source.buffer = decoded;

            // Create AnalyserNode for live RMS amplitude (drives VoiceBus.level)
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 1024;
            source.connect(analyser);
            analyser.connect(ctx.destination);

            // Store source for barge-in cancel
            audioSourceRef.current = source;

            // Start RMS loop — hooks live audio level into VoiceBus (per D-06)
            window.VoiceBus._startLoop(analyser, 1.4);

            source.onended = () => {
              window.VoiceBus._stopLoop();
              window.VoiceBus.setState('idle');
              speakingRef.current = false;
              audioSourceRef.current = null;
              resolve();
            };

            speakingRef.current = true;
            source.start();
          })
          .catch((err) => {
            console.warn('[VoiceController] streamTTS failed, falling back to SpeechSynthesis:', err);
            // Fallback to SpeechSynthesisUtterance with fake amplitude
            const synth = window.speechSynthesis;
            if (!synth) {
              window.VoiceBus.setState('idle');
              speakingRef.current = false;
              resolve();
              return;
            }
            const u = new SpeechSynthesisUtterance(text);
            u.rate = 1.05;
            u.pitch = 1.0;
            u.volume = 1.0;
            window.VoiceBus.setState('speaking');
            window.VoiceBus.attachTTSFake(u);
            u.onend = () => {
              window.VoiceBus.setState('idle');
              speakingRef.current = false;
              resolve();
            };
            u.onerror = () => {
              window.VoiceBus.setState('idle');
              speakingRef.current = false;
              resolve();
            };
            speakingRef.current = true;
            synth.speak(u);
          });
      });
    },
    []
  );

  // speak — public wrapper around streamTTS
  const speak = useCallback(
    (text: string): Promise<void> => {
      if (!text) return Promise.resolve();
      return streamTTS(text);
    },
    [streamTTS]
  );

  // startTour — iterate TOUR_STEPS sequentially, await each speak(), dispatch tool calls
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const startTour = useCallback(async () => {
    for (const step of TOUR_STEPS) {
      if (!activeRef.current) break;

      if (step.page !== currentPage) {
        goPage(step.page);
        await waitForPage(step.page);
      }

      await speak(step.say);

      if (step.call) {
        dispatchToolCall(step.call[0], step.call[1]);
      }
    }
  }, [currentPage, goPage, speak, dispatchToolCall, waitForPage]);

  // handleUserTurn — ALL utterances go to Grok (except local stop for instant response)
  const handleUserTurn = useCallback(
    async (utterance: string) => {
      // Close Scribe connection immediately to prevent TTS echo feedback loop.
      // Without this, Scribe hears Parz's TTS response via the mic and transcribes
      // it as another user utterance, causing double/overlapping speech.
      try { connectionRef.current?.close(); } catch {}
      connectionRef.current = null;
      try { detachMicRef.current?.(); detachMicRef.current = null; } catch {}

      window.VoiceBus.setState('thinking');
      setCaption('Thinking\u2026');

      const u = utterance.toLowerCase();

      // Stop intent stays local for instant response (no network latency)
      if (isStopIntent(u)) {
        stopAll();
        return;
      }

      // Everything else goes to Grok — it decides intent via tool calls
      try {
        historyRef.current = [
          ...historyRef.current,
          { role: 'user', content: utterance },
        ];

        const voiceInstruction =
          'Keep replies under 2 sentences. This is a voice channel — no markdown, no lists, no emoji. ';

        const messages = [
          ...historyRef.current.slice(-20).map((m) => ({
            id: Math.random().toString(36).slice(2),
            role: m.role as 'user' | 'assistant',
            content: m.role === 'user' && m.content === utterance
              ? voiceInstruction + m.content
              : m.content,
            parts: [{ type: 'text' as const, text: m.role === 'user' && m.content === utterance
              ? voiceInstruction + m.content
              : m.content }],
          })),
        ];

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages, isVoice: true }),
        });

        if (!res.ok) throw new Error(`/api/chat returned ${res.status}`);

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let responseText = '';
        const toolCalls: { name: string; args: Record<string, unknown> }[] = [];

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            for (const line of lines) {
              // SSE data lines
              if (line.startsWith('data: ')) {
                const payload = line.slice(6);
                if (payload === '[DONE]') continue;
                try {
                  const evt = JSON.parse(payload);
                  // Text delta
                  if (evt.type === 'text-delta' && typeof evt.delta === 'string') {
                    responseText += evt.delta;
                  }
                  // Tool call complete with parsed input
                  if (evt.type === 'tool-input-available' && evt.toolName) {
                    toolCalls.push({ name: evt.toolName, args: evt.input || {} });
                  }
                } catch {}
              }
              // Legacy format fallback (0: prefix)
              if (line.startsWith('0:')) {
                try {
                  const parsed = JSON.parse(line.slice(2));
                  if (typeof parsed === 'string') responseText += parsed;
                } catch {}
              }
            }
          }
        }

        const clean = responseText.trim();

        // Append assistant response to history (text portion)
        if (clean) {
          historyRef.current = [
            ...historyRef.current,
            { role: 'assistant', content: clean },
          ];
        }

        // Execute tool calls from Grok
        for (const tc of toolCalls) {
          switch (tc.name) {
            case 'navigate':
              goPage((tc.args as { page: string }).page);
              break;
            case 'openProject': {
              // Navigate to portfolio first, then open project
              goPage('portfolio');
              await waitForPage('portfolio');
              dispatchToolCall('openProject', { slug: (tc.args as { name: string }).name });
              break;
            }
            case 'scrollTo':
              dispatchToolCall('scrollTo', { selector: (tc.args as { section: string }).section });
              break;
            case 'toggleTheme':
              dispatchToolCall('toggleTheme', {});
              break;
            case 'openLink':
              dispatchToolCall('openLink', tc.args);
              break;
            case 'startTour':
              startTour();
              break;
            case 'switchToText':
              stopAll();
              openTextChat();
              setActive(false);
              return; // Don't speak after switching to text
            case 'endCall':
              if (clean) await speak(clean);
              stopAll();
              setActive(false);
              return; // Don't speak again after ending
          }
        }

        // Speak the text response (if any)
        if (clean) {
          await speak(clean);
        } else if (toolCalls.length === 0) {
          await speak("Hmm, I lost my train of thought.");
        }
      } catch {
        await speak("My server's glitching. Give me a sec and try again.");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [goPage, openTextChat, speak, stopAll, dispatchToolCall, startTour, waitForPage]
  );

  // startListeningFallback — existing Web Speech API STT, called when ElevenLabs fails (per D-02)
  const startListeningFallback = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setCaption("Speech recognition isn't available in this browser. Try Chrome or Edge.");
      window.VoiceBus.setState('idle');
      return;
    }

    try { connectionRef.current?.close(); } catch {}

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = new SR() as any;
    r.continuous = false;
    r.interimResults = true;
    r.lang = 'en-US';

    r.onstart = () => {
      window.VoiceBus.setState('listening');
      setCaption('Listening\u2026');
      window.VoiceBus.attachMic().then((detach: () => void) => {
        if (window.VoiceBus.state !== 'listening') {
          try { detach(); } catch {}
          return;
        }
        detachMicRef.current = detach;
      });
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    r.onresult = (ev: any) => {
      let interim = '';
      let finalT = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const t = ev.results[i][0].transcript;
        if (ev.results[i].isFinal) finalT += t;
        else interim += t;
      }
      setTranscript(interim || finalT);
      setCaption(interim || finalT);
      if (finalT) handleUserTurn(finalT.trim());
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    r.onerror = (e: any) => {
      if (e.error === 'not-allowed') {
        setMicDenied(true);
        setCaption('Mic access denied. Click to retry.');
      } else {
        setCaption('Mic error: ' + e.error);
      }
      window.VoiceBus.setState('idle');
    };

    r.onend = () => {
      try {
        detachMicRef.current?.();
        detachMicRef.current = null;
      } catch {}
      if (window.VoiceBus.state === 'listening') {
        window.VoiceBus.setState('idle');
      }
    };

    connectionRef.current = r as unknown as RealtimeConnection;
    try { r.start(); } catch (e) {
      setCaption("Couldn't start mic: " + (e as Error).message);
    }
  }, [handleUserTurn]);

  // startListening — ElevenLabs Scribe v2 primary STT, Web Speech API fallback (per D-01, D-02)
  const startListening = useCallback(async () => {
    window.VoiceBus.setState('listening');
    setCaption('Listening\u2026');

    // Create sttCtx BEFORE first await — keeps creation in user gesture frame
    // (RESEARCH.md Pitfall 3: AudioContext autoplay policy blocks creation after await)
    // Per D-06: separate 16kHz AudioContext avoids TTS echo on VoiceBus._ctx
    const sttCtx = new AudioContext({ sampleRate: 16000 });

    try {
      // 1. Fetch single-use token — never cache, fresh per session (per D-03, D-04)
      const res = await fetch('/api/stt-token', { method: 'POST' });
      if (!res.ok) throw new Error(`stt-token ${res.status}`);
      const { token } = await res.json() as { token: string };

      // 2. Connect Scribe — SDK manages getUserMedia internally (per D-05)
      const connection = Scribe.connect({
        token,
        modelId: 'scribe_v2_realtime',
        commitStrategy: CommitStrategy.VAD,
        vadSilenceThresholdSecs: 1.2,
        languageCode: 'en',
        microphone: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // 3. Wire transcript events
      connection.on(RealtimeEvents.SESSION_STARTED, () => {
        // Per D-06: attach VoiceBus mic AFTER session confirmed — mirrors existing r.onstart pattern
        window.VoiceBus.attachMic().then((detach: () => void) => {
          if (window.VoiceBus.state !== 'listening') { detach(); return; }
          detachMicRef.current = detach;
        });
      });

      connection.on(RealtimeEvents.PARTIAL_TRANSCRIPT, (data) => {
        setTranscript((data as { text: string }).text);
        setCaption((data as { text: string }).text);
      });

      connection.on(RealtimeEvents.COMMITTED_TRANSCRIPT, (data) => {
        const text = (data as { text: string }).text.trim();
        if (text) handleUserTurn(text);
      });

      connection.on(RealtimeEvents.AUTH_ERROR, () => {
        setMicDenied(true);
        setCaption('Mic access denied. Click to retry.');
        window.VoiceBus.setState('idle');
        connection.close();
      });

      connection.on(RealtimeEvents.ERROR, () => {
        window.VoiceBus.setState('idle');
        connection.close();
        startListeningFallback(); // per D-02: silent fallback, no user notification
      });

      connection.on(RealtimeEvents.CLOSE, () => {
        sttCtx.close().catch(() => {});
        detachMicRef.current?.();
        detachMicRef.current = null;
        if (window.VoiceBus.state === 'listening') window.VoiceBus.setState('idle');
      });

      connectionRef.current = connection;

    } catch {
      // Token fetch failed or SDK unavailable — silent fallback to Web Speech API (per D-02)
      sttCtx.close().catch(() => {});
      startListeningFallback();
    }
  }, [handleUserTurn, startListeningFallback]);

  // bargeIn — energy-threshold barge-in during speaking state (per D-21)
  const bargeIn = useCallback(() => {
    try { audioSourceRef.current?.stop(); } catch {}
    audioSourceRef.current = null;
    window.VoiceBus._stopLoop();
    window.VoiceBus.setState('listening');
    void startListening(); // void guard: startListening is now async
  }, [startListening]);

  // Subscribe to VoiceBus 'level' events for barge-in detection (per D-21)
  // When speaking and energy > 0.15, cancel TTS and switch to listening.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.VoiceBus) return;

    const unsubLevel = window.VoiceBus.on('level', (lvl) => {
      const level = lvl as number;
      // Per D-24: cap level to 0.2 when prefers-reduced-motion
      const effectiveLevel = prefersReduced ? Math.min(level, 0.2) : level;

      // Raised from 0.15 to 0.35 — ElevenLabs TTS has consistent high amplitude; prevents self-interruption
      if (window.VoiceBus.state === 'speaking' && effectiveLevel > 0.35) {
        bargeIn();
      }
    });

    return unsubLevel as () => void;
  }, [bargeIn, prefersReduced]);

  // open — activate voice mode and greet after morph settles
  const open = useCallback(() => {
    setActive(true);
    setTimeout(() => {
      const greetMessage =
        currentPage === 'home'
          ? "Hey, I'm Parz. I can give you a tour, or just chat. What are we doing?"
          : "Parz here. Ask me anything, or say take me home.";
      speak(greetMessage);
    }, 480);
  }, [currentPage, speak]);

  // close — stop all audio and persist history to localStorage (per D-22)
  const close = useCallback(() => {
    stopAll();
    // Per D-22: persist last 20 messages to localStorage on close
    try {
      localStorage.setItem('pf-voice-history', JSON.stringify(historyRef.current.slice(-20)));
    } catch {
      // Ignore storage errors
    }
    setActive(false);
  }, [stopAll]);

  // Keyboard shortcuts (per D-23): Space = push-to-talk, Esc = close voice mode
  useEffect(() => {
    if (!active) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && window.VoiceBus.state !== 'listening') {
        e.preventDefault();
        void startListening(); // startListening is now async — void guard prevents unhandled rejection
      }
      if (e.code === 'Escape') {
        close();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        connectionRef.current?.close();
        connectionRef.current = null;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [active, startListening, close]);

  return {
    active,
    open,
    close,
    micDenied,
    prefersReduced,
    voiceProps: {
      state: voiceState,
      caption,
      transcript,
      onMic: voiceState === 'listening' ? stopAll : startListening,
      onStop: stopAll,
      onClose: close,
      onFallbackChat: () => {
        stopAll();
        openTextChat();
        setActive(false);
      },
    },
  };
}
