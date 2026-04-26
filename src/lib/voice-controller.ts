'use client';

// src/lib/voice-controller.ts
// Full voice session state machine — STT (ElevenLabs Scribe + Web Speech fallback),
// ElevenLabs TTS, AI agent loop, barge-in, persistent memory, accessibility shortcuts.
// Tours / walkthroughs are driven by the LLM via tool calls (no hardcoded script).

import { useState, useEffect, useRef, useCallback } from 'react';
import { isStopIntent } from './voice-commands';
import { Scribe, RealtimeEvents, CommitStrategy } from '@elevenlabs/client';
import type { RealtimeConnection } from '@elevenlabs/client';
import type { ControlResult } from '@/providers/site-control-provider';

// ToolCallbacks carries App-level handlers for tool calls in AI responses.
// All fields are optional so callers can wire only what they support this phase.
// Un-wired tools log a console.warn and are no-ops — they do NOT silently succeed.
export interface ToolCallbacks {
  openProject?: (args: { slug: string }) => ControlResult | void;
  scrollTo?: (args: { selector: string }) => ControlResult | void;
  closeBrowser?: () => ControlResult;
  openCurrentProjectExternal?: () => ControlResult;
  unsupportedIframeControl?: () => ControlResult;
  openLink?: (args: { url: string }) => void;
  toggleTheme?: () => void;
  // navigate is handled internally by goPage; not in ToolCallbacks.
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
  // VOICE-06: guard timer that fires if Scribe accepts the connection but never
  // emits SESSION_STARTED. Cleared in SESSION_STARTED / AUTH_ERROR / ERROR /
  // outer catch / cancelAllAudio. On fire: close Scribe, fall back to Web Speech.
  const sessionGuardRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // VOICE-07: worst-case timeout for the SpeechSynthesis fallback path. Some
  // browsers (notably Safari with disabled synth) silently no-op synth.speak()
  // and never fire onend/onerror. Duration is text-length-aware (50ms/char,
  // 1s floor, 30s cap). Cleared in onend/onerror and from cancelAllAudio.
  const synthGuardRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const detachMicRef = useRef<(() => void) | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const historyRef = useRef<HistoryMessage[]>([]);
  const activeRef = useRef(false);  // shadow ref to read active in callbacks

  // Audio-serialization refs (Phase 22 — overlap fix).
  // speakResolverRef holds the resolver of the in-flight speak() Promise so cancelAllAudio
  // can unblock any pending awaiter (otherwise old handleUserTurn calls hang forever).
  // speakAbortRef cancels in-flight /api/tts fetches so a new speak doesn't race the old.
  // speechUtteranceRef tracks the current SpeechSynthesisUtterance for identity checks
  // in onend so a stale fallback utterance doesn't reset state on the new speak.
  // turnGenerationRef increments at the start of every handleUserTurn — older turns
  // bail at await checkpoints when the counter has moved on.
  const speakResolverRef = useRef<(() => void) | null>(null);
  const speakAbortRef = useRef<AbortController | null>(null);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const turnGenerationRef = useRef(0);

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

  // VOICE-09: runTool wraps every tool callback invocation so a throwing callback
  // does not abort the voice turn. Emits 'tool-executing' before invocation and
  // 'tool-success' / 'tool-error' on settle. Returns { ok } so callers can inspect
  // outcome (synchronous path only -- async resolves to ok=true optimistically).
  // Phase 27 / FSB-04: 'tool-executing' now carries a { name, args } payload so
  // caption consumers (FsbControlOverlay) can render context-aware captions like
  // 'Opening {projectName}…' and 'Navigating to {page}…'. 'tool-success' and
  // 'tool-error' remain payload-less — caption layer persists the last args until
  // success/error arrives. Existing payload-agnostic subscribers (voice-glow.tsx)
  // continue to work because they ignore the payload.
  const runTool = (
    name: string,
    args: Record<string, unknown>,
    fn: () => unknown,
  ): { ok: boolean } => {
    const hasBus = typeof window !== 'undefined' && !!window.VoiceBus;
    if (hasBus) window.VoiceBus.emit('tool-executing', { name, args });
    try {
      const result = fn();
      if (result && typeof (result as { then?: unknown }).then === 'function') {
        (result as Promise<unknown>).then(
          (r) => {
            const ok = !(r && typeof r === 'object' && 'ok' in (r as object) && (r as { ok: boolean }).ok === false);
            if (hasBus) window.VoiceBus.emit(ok ? 'tool-success' : 'tool-error');
          },
          (err) => {
            console.error(`[VoiceController] ${name} rejected:`, err);
            if (hasBus) window.VoiceBus.emit('tool-error');
          }
        );
        return { ok: true };
      }
      const ok = !(result && typeof result === 'object' && 'ok' in (result as object) && (result as { ok: boolean }).ok === false);
      if (hasBus) window.VoiceBus.emit(ok ? 'tool-success' : 'tool-error');
      return { ok };
    } catch (err) {
      console.error(`[VoiceController] ${name} threw:`, err);
      if (hasBus) window.VoiceBus.emit('tool-error');
      return { ok: false };
    }
  };

  // dispatchToolCall — single dispatch point for all step.call entries and AI tool responses.
  // Per D-19: openProject is wired when toolCallbacks.openProject provided; others console.warn on miss.
  // Phase 13: emits VoiceBus 'tool-executing' before callback and 'tool-success'/'tool-error' after.
  // Phase 25 / VOICE-09: callback invocations now route through runTool so a throwing callback
  // no longer aborts the voice turn.
  const dispatchToolCall = useCallback(
    (name: string, args: Record<string, unknown>): void => {
      switch (name) {
        case 'openProject':
          if (toolCallbacks?.openProject) {
            runTool('openProject', args, () => toolCallbacks.openProject!(args as { slug: string }));
          } else {
            console.warn('[VoiceController] openProject tool called but no toolCallbacks.openProject provided');
            if (typeof window !== 'undefined' && window.VoiceBus) window.VoiceBus.emit('tool-error');
          }
          break;
        case 'scrollTo':
          if (toolCallbacks?.scrollTo) {
            runTool('scrollTo', args, () => toolCallbacks.scrollTo!(args as { selector: string }));
          } else {
            console.warn('[VoiceController] scrollTo tool called but no toolCallbacks.scrollTo provided');
            if (typeof window !== 'undefined' && window.VoiceBus) window.VoiceBus.emit('tool-error');
          }
          break;
        case 'openLink':
          if (toolCallbacks?.openLink) {
            runTool('openLink', args, () => toolCallbacks.openLink!(args as { url: string }));
          } else {
            console.warn('[VoiceController] openLink tool called but no toolCallbacks.openLink provided');
            if (typeof window !== 'undefined' && window.VoiceBus) window.VoiceBus.emit('tool-error');
          }
          break;
        case 'closeBrowser':
          if (toolCallbacks?.closeBrowser) {
            runTool('closeBrowser', args, () => toolCallbacks.closeBrowser!());
          } else {
            console.warn('[VoiceController] closeBrowser tool called but no toolCallbacks.closeBrowser provided');
            if (typeof window !== 'undefined' && window.VoiceBus) window.VoiceBus.emit('tool-error');
          }
          break;
        case 'openCurrentProjectExternal':
          if (toolCallbacks?.openCurrentProjectExternal) {
            runTool('openCurrentProjectExternal', args, () => toolCallbacks.openCurrentProjectExternal!());
          } else {
            console.warn('[VoiceController] openCurrentProjectExternal tool called but no toolCallbacks.openCurrentProjectExternal provided');
            if (typeof window !== 'undefined' && window.VoiceBus) window.VoiceBus.emit('tool-error');
          }
          break;
        case 'unsupportedIframeControl':
          if (toolCallbacks?.unsupportedIframeControl) {
            runTool('unsupportedIframeControl', args, () => toolCallbacks.unsupportedIframeControl!());
          } else {
            console.warn('[VoiceController] unsupportedIframeControl tool called but no toolCallbacks.unsupportedIframeControl provided');
            if (typeof window !== 'undefined' && window.VoiceBus) window.VoiceBus.emit('tool-error');
          }
          break;
        case 'toggleTheme':
          if (toolCallbacks?.toggleTheme) {
            runTool('toggleTheme', args, () => toolCallbacks.toggleTheme!());
          } else {
            console.warn('[VoiceController] toggleTheme tool called but no toolCallbacks.toggleTheme provided');
            if (typeof window !== 'undefined' && window.VoiceBus) window.VoiceBus.emit('tool-error');
          }
          break;
        case 'navigate':
          runTool('navigate', args, () => {
            goPage((args as { page: string }).page);
          });
          break;
        case 'endCall':
          break;
        default:
          console.warn(`[VoiceController] Unknown tool call: ${name}`, args);
      }
    },
    [toolCallbacks, goPage]
  );

  // VOICE-06: clear the Scribe SESSION_STARTED guard timer if one is armed.
  // Idempotent — safe to call from any of the five clear sites.
  const clearSessionGuard = () => {
    if (sessionGuardRef.current !== null) {
      clearTimeout(sessionGuardRef.current);
      sessionGuardRef.current = null;
    }
  };

  // VOICE-07: clear the SpeechSynthesis fallback worst-case timer if armed.
  // Idempotent -- safe to call from onend/onerror, the guard's own fire path,
  // and cancelAllAudio.
  const clearSynthGuard = () => {
    if (synthGuardRef.current !== null) {
      clearTimeout(synthGuardRef.current);
      synthGuardRef.current = null;
    }
  };

  // cancelAllAudio — single source of truth for stopping in-flight TTS, including
  // BufferSource playback, queued SpeechSynthesis utterances, and any /api/tts fetch
  // that is still in flight. Also unblocks any awaiter on speak() so old handleUserTurn
  // calls don't hang. Does NOT change VoiceBus state — the caller decides the new state.
  const cancelAllAudio = useCallback(() => {
    // VOICE-06: clear Scribe stall guard so a stop-while-connecting doesn't
    // leave a 5s timer firing into a torn-down session.
    clearSessionGuard();

    // VOICE-07: clear synth fallback guard so a stop-during-speak doesn't
    // leave a stale timer firing into a torn-down speak() Promise.
    clearSynthGuard();

    // Abort any in-flight /api/tts fetch so a stale .then doesn't create another source
    try { speakAbortRef.current?.abort(); } catch {}
    speakAbortRef.current = null;

    // Stop the current BufferSource. Identity checks in onended skip stale state mutations.
    const src = audioSourceRef.current;
    audioSourceRef.current = null;
    if (src) {
      try { src.stop(); } catch {}
    }

    // Drop the tracked utterance and cancel the synth queue
    speechUtteranceRef.current = null;
    try { window.speechSynthesis?.cancel(); } catch {}

    // Unblock any awaiter so an old `await speak()` returns instead of hanging
    const r = speakResolverRef.current;
    speakResolverRef.current = null;
    if (r) {
      try { r(); } catch {}
    }

    window.VoiceBus._stopLoop();
    speakingRef.current = false;
  }, []);

  // stopAll — cancel all ongoing audio/speech/recognition
  const stopAll = useCallback(() => {
    try { connectionRef.current?.close(); } catch {}
    connectionRef.current = null;
    cancelAllAudio();
    try {
      detachMicRef.current?.();
      detachMicRef.current = null;
    } catch {}
    window.VoiceBus.setState('idle');
    setCaption('');
    setTranscript('');
  }, [cancelAllAudio]);

  // streamTTS — ElevenLabs streaming TTS via /api/tts (per D-01, D-04).
  // Phase 22: cancels any prior in-flight TTS at entry, tracks an AbortController so
  // a cancel-mid-fetch doesn't strand a stale .then, and identity-checks in onended
  // so a cancelled source doesn't reset state on top of the new one.
  const streamTTS = useCallback(
    (text: string): Promise<void> => {
      return new Promise<void>((resolve) => {
        // Cancel any prior speak before starting a new one — closes overlap modes O-1, O-5.
        cancelAllAudio();

        speakResolverRef.current = resolve;
        const ac = new AbortController();
        speakAbortRef.current = ac;

        window.VoiceBus.setState('speaking');
        setCaption(text);

        fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, voiceId: 'dMWVPH9DSxWOMrrrUso3' }),
          signal: ac.signal,
        })
          .then(async (res) => {
            if (ac.signal.aborted) return;
            if (!res.ok) throw new Error(`TTS fetch failed: ${res.status}`);
            const buffer = await res.arrayBuffer();
            if (ac.signal.aborted) return;
            const ctx = window.VoiceBus._getCtx();
            if (!ctx) throw new Error('AudioContext unavailable');
            // Phase 23 hotfix: actually await resume() before using the context.
            // _getCtx fires resume() but doesn't await it — if the context is still
            // suspended when source.start() runs, audio plays silently and onended
            // never fires, hanging the speak Promise.
            if (ctx.state === 'suspended') {
              try { await ctx.resume(); } catch {}
            }
            const decoded = await ctx.decodeAudioData(buffer);
            if (ac.signal.aborted) return;

            const source = ctx.createBufferSource();
            source.buffer = decoded;

            // Create AnalyserNode for live RMS amplitude (drives VoiceBus.level)
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 1024;
            source.connect(analyser);
            analyser.connect(ctx.destination);

            audioSourceRef.current = source;

            // Start RMS loop — hooks live audio level into VoiceBus (per D-06)
            window.VoiceBus._startLoop(analyser, 1.4);

            source.onended = () => {
              // Identity check: only mutate state if THIS source is still current.
              // A cancelled source whose onended fires late must not touch state.
              if (audioSourceRef.current === source) {
                window.VoiceBus._stopLoop();
                window.VoiceBus.setState('idle');
                speakingRef.current = false;
                audioSourceRef.current = null;
                speakAbortRef.current = null;
                if (speakResolverRef.current === resolve) speakResolverRef.current = null;
              }
              resolve();
            };

            speakingRef.current = true;
            source.start();
          })
          .catch((err) => {
            // Cancelled by us — do not fall back to synth, do not resolve here
            // (cancelAllAudio already resolved this Promise via speakResolverRef).
            if (ac.signal.aborted || (err instanceof Error && err.name === 'AbortError')) return;
            console.warn('[VoiceController] streamTTS failed, falling back to SpeechSynthesis:', err);
            // Fallback to SpeechSynthesisUtterance with fake amplitude
            const synth = window.speechSynthesis;
            if (!synth) {
              window.VoiceBus.setState('idle');
              speakingRef.current = false;
              if (speakResolverRef.current === resolve) speakResolverRef.current = null;
              speakAbortRef.current = null;
              resolve();
              return;
            }
            // Cancel any queued utterances before starting ours
            try { synth.cancel(); } catch {}
            const u = new SpeechSynthesisUtterance(text);
            u.rate = 1.05;
            u.pitch = 1.0;
            u.volume = 1.0;
            speechUtteranceRef.current = u;
            window.VoiceBus.setState('speaking');
            window.VoiceBus.attachTTSFake(u);
            const finishSynth = () => {
              if (speechUtteranceRef.current === u) {
                window.VoiceBus.setState('idle');
                speakingRef.current = false;
                speechUtteranceRef.current = null;
                speakAbortRef.current = null;
                if (speakResolverRef.current === resolve) speakResolverRef.current = null;
              }
              resolve();
            };
            // VOICE-07: wrap onend/onerror to clear the worst-case guard before
            // calling finishSynth. Identity check inside finishSynth is the final
            // safety net if both fire (RESEARCH.md Pitfall 3).
            const wrappedFinishSynth = () => {
              clearSynthGuard();
              finishSynth();
            };
            u.onend = wrappedFinishSynth;
            u.onerror = wrappedFinishSynth;
            speakingRef.current = true;
            // VOICE-07: worst-case timeout (50ms/char, 1s floor, 30s cap).
            // Some browsers (notably Safari with disabled synth) silently no-op
            // synth.speak() and never fire onend/onerror -- this guard ensures
            // finishSynth is called and the speak() Promise resolves. Cleared by
            // wrappedFinishSynth above and by clearSynthGuard() in cancelAllAudio.
            const guardMs = Math.min(30000, Math.max(1000, text.length * 50));
            synthGuardRef.current = setTimeout(() => {
              synthGuardRef.current = null;
              try { synth.cancel(); } catch {}
              finishSynth(); // identity-checked finalizer -- safe even if onend already fired
            }, guardMs);
            synth.speak(u);
          });
      });
    },
    [cancelAllAudio]
  );

  // speak — public wrapper around streamTTS
  const speak = useCallback(
    (text: string): Promise<void> => {
      if (!text) return Promise.resolve();
      return streamTTS(text);
    },
    [streamTTS]
  );

  // handleUserTurn — ALL utterances go to Grok (except local stop for instant response).
  // Phase 23: optional `kind` arg supports an LLM-driven greet — no hardcoded speech.
  // - kind 'user' (default): existing path. Utterance is the user's transcription.
  //   It IS appended to history and the LLM sees it as a real user turn.
  // - kind 'greet': utterance is a synthetic kickoff instruction (e.g. "[Voice mode
  //   just opened on the home page. Greet briefly...]"). It is NOT appended to history
  //   because the user never said it. Only the assistant's response goes to history.
  const handleUserTurn = useCallback(
    async (utterance: string, opts: { kind?: 'user' | 'greet' } = {}) => {
      const kind = opts.kind ?? 'user';

      // Close Scribe connection immediately to prevent TTS echo feedback loop.
      // Without this, Scribe hears Parz's TTS response via the mic and transcribes
      // it as another user utterance, causing double/overlapping speech.
      try { connectionRef.current?.close(); } catch {}
      connectionRef.current = null;
      try { detachMicRef.current?.(); detachMicRef.current = null; } catch {}

      // Phase 22: cancel any in-flight TTS/fetch from a prior turn so a slow previous
      // response doesn't keep talking over this one. Closes overlap mode O-4.
      cancelAllAudio();

      // Phase 22: bump the turn generation. Older parallel turns (e.g. Web Speech
      // multi-final firing handleUserTurn twice — overlap mode O-3) check this and
      // bail at await checkpoints once a newer turn has started.
      turnGenerationRef.current += 1;
      const myTurn = turnGenerationRef.current;

      window.VoiceBus.setState('thinking');
      setCaption('Thinking\u2026');

      // Local stop-intent fast path is for real user utterances only — a greet
      // trigger is never a stop, so skip the check when kind === 'greet'.
      if (kind === 'user') {
        const u = utterance.toLowerCase();
        if (isStopIntent(u)) {
          stopAll();
          return;
        }
      }

      // Everything else goes to Grok — it decides intent via tool calls
      try {
        // For real user turns: append to history so the LLM sees it.
        // For greet: do NOT append — the trigger is synthetic, the user never said it.
        if (kind === 'user') {
          historyRef.current = [
            ...historyRef.current,
            { role: 'user', content: utterance },
          ];
        }

        const voiceInstruction =
          'Keep replies under 2 sentences. This is a voice channel — no markdown, no lists, no emoji. ';

        const baseMessages = historyRef.current.slice(-20).map((m) => ({
          id: Math.random().toString(36).slice(2),
          role: m.role as 'user' | 'assistant',
          content: m.role === 'user' && kind === 'user' && m.content === utterance
            ? voiceInstruction + m.content
            : m.content,
          parts: [{ type: 'text' as const, text: m.role === 'user' && kind === 'user' && m.content === utterance
            ? voiceInstruction + m.content
            : m.content }],
        }));

        // For greet: append the synthetic trigger as a one-shot user message
        // so the LLM has something to respond to. It is not in history.
        const messages = kind === 'greet'
          ? [
              ...baseMessages,
              {
                id: Math.random().toString(36).slice(2),
                role: 'user' as const,
                content: voiceInstruction + utterance,
                parts: [{ type: 'text' as const, text: voiceInstruction + utterance }],
              },
            ]
          : baseMessages;

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

        // F-01: keep a leftover buffer between reads so JSON events that span
        // chunk boundaries are not silently dropped by JSON.parse inside the catch.
        const handleLine = (line: string) => {
          if (line.startsWith('data: ')) {
            const payload = line.slice(6);
            if (payload === '[DONE]') return;
            try {
              const evt = JSON.parse(payload);
              if (evt.type === 'text-delta' && typeof evt.delta === 'string') {
                responseText += evt.delta;
              }
              if (evt.type === 'tool-input-available' && evt.toolName) {
                toolCalls.push({ name: evt.toolName, args: evt.input || {} });
              }
            } catch {}
            return;
          }
          if (line.startsWith('0:')) {
            try {
              const parsed = JSON.parse(line.slice(2));
              if (typeof parsed === 'string') responseText += parsed;
            } catch {}
          }
        };

        if (reader) {
          let buffer = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              buffer += decoder.decode();
              if (buffer) handleLine(buffer);
              break;
            }
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';
            for (const line of lines) handleLine(line);
          }
        }

        const clean = responseText.trim();

        // Phase 22: bail if a newer turn started while we were fetching — closes O-3.
        // Don't dispatch tools or speak; the user moved on to a different utterance.
        if (myTurn !== turnGenerationRef.current) return;

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
            case 'closeBrowser':
              dispatchToolCall('closeBrowser', {});
              break;
            case 'openCurrentProjectExternal':
              dispatchToolCall('openCurrentProjectExternal', {});
              break;
            case 'unsupportedIframeControl':
              dispatchToolCall('unsupportedIframeControl', {});
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

        // Speak the text response (if any). Phase 23: removed the empty-response
        // hardcoded fallback. If Grok returns no text (whether or not tools fired),
        // we go silent — every word the user hears is LLM-generated or nothing at
        // all. Phase 23 hotfix: the `else` branch (was previously gated on
        // `toolCalls.length === 0`) now always runs when there's no text, so state
        // never hangs at 'thinking' for tool-only responses.
        if (clean) {
          await speak(clean);
        } else {
          window.VoiceBus.setState('idle');
          setCaption('');
        }
      } catch {
        // Phase 23: removed hardcoded server-error speak. Surface a UI caption
        // (on-screen text, not voice) and fall to idle. The LLM is unreachable
        // by definition in this branch, so we have nothing dynamic to say.
        window.VoiceBus.setState('idle');
        setCaption('Server hiccup \u2014 try again.');
      }
    },
    [goPage, openTextChat, speak, stopAll, dispatchToolCall, cancelAllAudio]
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

      // VOICE-06: arm 5s guard against silent Scribe stall. If SESSION_STARTED
      // never fires, close the connection and fall back to Web Speech. Set
      // ref to null BEFORE close() to break CLOSE-handler reentrancy.
      sessionGuardRef.current = setTimeout(() => {
        sessionGuardRef.current = null;
        try { connection.close(); } catch {}
        setCaption('Speech service slow \u2014 switching to fallback');
        startListeningFallback();
      }, 5000);

      // 3. Wire transcript events
      connection.on(RealtimeEvents.SESSION_STARTED, () => {
        clearSessionGuard();
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
        clearSessionGuard();
        setMicDenied(true);
        setCaption('Mic access denied. Click to retry.');
        window.VoiceBus.setState('idle');
        connection.close();
      });

      connection.on(RealtimeEvents.ERROR, () => {
        clearSessionGuard();
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
      // VOICE-06: clear guard if token fetch failed (guard may not have been armed
      // yet, but clearSessionGuard is idempotent).
      clearSessionGuard();
      // Token fetch failed or SDK unavailable — silent fallback to Web Speech API (per D-02)
      sttCtx.close().catch(() => {});
      startListeningFallback();
    }
  }, [handleUserTurn, startListeningFallback]);

  // bargeIn — energy-threshold barge-in during speaking state (per D-21)
  const bargeIn = useCallback(() => {
    cancelAllAudio();
    window.VoiceBus.setState('listening');
    void startListening(); // void guard: startListening is now async
  }, [cancelAllAudio, startListening]);

  // Subscribe to VoiceBus 'level' events for barge-in detection (per D-21).
  // F-03: threshold scales with the prefers-reduced-motion cap so a11y users
  // keep functional barge-in. The 0.35 baseline (raised from 0.15) handles
  // ElevenLabs TTS's consistently high amplitude and prevents self-interruption.
  //
  // Phase 23 regression fix: ONLY react to live analyser readings. setState()
  // emits a fallback default level (0.75 for 'speaking') when no analyser is
  // running — that's higher than the 0.35 threshold, so without the _liveAudio
  // guard the very first setState('speaking') in streamTTS triggered an instant
  // self-barge-in that aborted the TTS fetch (Phase 22's AbortController made
  // the cancel cascade complete) and Parz never spoke at all.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.VoiceBus) return;

    const unsubLevel = window.VoiceBus.on('level', (lvl) => {
      const level = lvl as number;
      const effectiveLevel = prefersReduced ? Math.min(level, 0.2) : level;
      const threshold = prefersReduced ? 0.15 : 0.35;
      if (
        window.VoiceBus._liveAudio &&
        window.VoiceBus.state === 'speaking' &&
        effectiveLevel > threshold
      ) {
        bargeIn();
      }
    });

    return unsubLevel as () => void;
  }, [bargeIn, prefersReduced]);

  // open — activate voice mode and kick off an LLM-generated greeting after the
  // navbar morph settles. Phase 22: guard the timer so a fast user doesn't hear
  // the greet overlap their answer (mode O-2). Phase 23: the greet is no longer
  // hardcoded — handleUserTurn(trigger, { kind: 'greet' }) sends a synthetic
  // kickoff instruction to the LLM and speaks whatever Parz writes back.
  //
  // Phase 23 hotfix: pre-warm the VoiceBus AudioContext synchronously inside
  // the click gesture frame. Without this, the first speak()'s streamTTS tries
  // to create the context inside its fetch .then chain — long after the click
  // gesture has expired — and the browser autoplay policy keeps the context
  // suspended. A suspended context lets source.start() succeed silently but
  // never fires onended, so state hangs in 'speaking' and Parz appears mute.
  // Calling _getCtx() inside the gesture creates (or resumes) the context now.
  const open = useCallback(() => {
    setActive(true);
    if (typeof window !== 'undefined' && window.VoiceBus) {
      try { window.VoiceBus._getCtx(); } catch {}
    }
    setTimeout(() => {
      if (!activeRef.current) return;
      if (speakingRef.current) return;
      if (typeof window !== 'undefined' && window.VoiceBus && window.VoiceBus.state !== 'idle') return;
      const page = currentPage ?? 'home';
      const trigger = `[Voice mode just opened on the ${page} page. Greet briefly and offer help — under 2 sentences, voice channel: no markdown, no lists, no emoji.]`;
      void handleUserTurn(trigger, { kind: 'greet' });
    }, 480);
  }, [currentPage, handleUserTurn]);

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

    // F-04: don't hijack Space when the user is typing — Space inside a text
    // field must add a space, not push-to-talk. Same guard on keyup so a stray
    // release inside a field doesn't tear down an unrelated active connection.
    const isTypingTarget = (target: EventTarget | null): boolean => {
      const el = target as HTMLElement | null;
      if (!el) return false;
      const tag = el.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable === true;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isTypingTarget(e.target) && window.VoiceBus.state !== 'listening') {
        e.preventDefault();
        void startListening();
      }
      if (e.code === 'Escape') {
        close();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isTypingTarget(e.target)) {
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
