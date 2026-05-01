'use client';

// src/lib/voice-controller.ts
// Full voice session state machine — STT (ElevenLabs Scribe + Web Speech fallback),
// ElevenLabs TTS, AI agent loop, barge-in, persistent memory, accessibility shortcuts.
// Tours / walkthroughs are driven by the LLM via tool calls (no hardcoded script).

import { useState, useEffect, useRef, useCallback } from 'react';
import { isStopIntent } from './voice-commands';
import {
  spokenCaptionWindow,
  tokenizeSpeechWords,
  wordIndexFromCharIndex,
} from './voice-caption-window';
import {
  buildVoiceOpeningPrompt,
  isExplicitTourIntent,
  isIntentionalBargeInTranscript,
  isMobileIntentionalBargeInTranscript,
  shouldPersistVoiceTurn,
  VOICE_BARGE_IN_MIN_WORDS,
  VOICE_OPEN_GREETING_DELAY_MS,
  type VoiceTurnKind,
} from './voice-turn-policy';
import type { ChatMorphRect, ChatVoiceSnapshot } from '@/lib/chat-morph';
import { Scribe, RealtimeEvents, CommitStrategy } from '@elevenlabs/client';
import type { RealtimeConnection } from '@elevenlabs/client';
import type { ControlResult } from '@/providers/site-control-provider';

const VOICE_CHAT_RESPONSE_TIMEOUT_MS = 35000;
const VOICE_TTS_PLAYBACK_GUARD_BUFFER_MS = 1750;

// ToolCallbacks carries App-level handlers for tool calls in AI responses.
// All fields are optional so callers can wire only what they support this phase.
// Un-wired tools log a console.warn and are no-ops — they do NOT silently succeed.
export interface ToolCallbacks {
  openProject?: (args: { slug: string }) => ControlResult | void;
  scrollTo?: (args: { selector: string }) => ControlResult | void;
  scrollProjectPreview?: (args: { direction?: string }) => ControlResult | void;
  closeBrowser?: () => ControlResult;
  openCurrentProjectExternal?: () => ControlResult;
  unsupportedIframeControl?: () => ControlResult;
  openLink?: (args: { url: string }) => ControlResult | void;
  toggleTheme?: () => void;
  // navigate is handled internally by goPage; not in ToolCallbacks.
  // endCall is handled internally by close(); not in ToolCallbacks.
}

export interface VoiceControllerOptions {
  goPage: (page: string, originX?: number, originY?: number) => void;
  openTextChat: (
    initialText?: string,
    originRect?: ChatMorphRect,
    voiceSnapshot?: ChatVoiceSnapshot,
  ) => void;
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
    onFallbackChat: (originRect?: ChatMorphRect, voiceSnapshot?: ChatVoiceSnapshot) => void;
  };
}

// Rolling message history entry
interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface VoiceStreamToolCall {
  name: string;
  args: Record<string, unknown>;
}

export interface VoiceStreamParseState {
  responseText: string;
  toolCalls: VoiceStreamToolCall[];
}

export function parseVoiceStreamLine(line: string, state: VoiceStreamParseState): void {
  if (line.startsWith('data: ')) {
    const payload = line.slice(6);
    if (payload === '[DONE]') return;
    try {
      const evt = JSON.parse(payload);
      if (evt.type === 'text-delta' && typeof evt.delta === 'string') {
        state.responseText += evt.delta;
      }
      if (evt.type === 'tool-input-available' && evt.toolName) {
        state.toolCalls.push({ name: evt.toolName, args: evt.input || {} });
      }
    } catch {}
    return;
  }
  if (line.startsWith('0:')) {
    try {
      const parsed = JSON.parse(line.slice(2));
      if (typeof parsed === 'string') state.responseText += parsed;
    } catch {}
  }
}

type UserTurnHandler = (utterance: string, opts?: { kind?: VoiceTurnKind }) => Promise<void>;

function isMobileBargeInContext(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(max-width: 639px), (pointer: coarse)').matches;
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

  const buildVoiceSnapshot = useCallback(
    (): ChatVoiceSnapshot => ({
      state: voiceState,
      caption,
      transcript,
      micDenied,
      compact: typeof window !== 'undefined'
        ? window.matchMedia('(max-width: 639px)').matches
        : false,
    }),
    [caption, micDenied, transcript, voiceState],
  );

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
  const initialGreetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chatAbortRef = useRef<AbortController | null>(null);
  const chatTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // VOICE-07: worst-case timeout for the SpeechSynthesis fallback path. Some
  // browsers (notably Safari with disabled synth) silently no-op synth.speak()
  // and never fire onend/onerror. Duration is text-length-aware (50ms/char,
  // 1s floor, 30s cap). Cleared in onend/onerror and from cancelAllAudio.
  const synthGuardRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioPlaybackGuardRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const detachMicRef = useRef<(() => void) | null>(null);
  const bargeInStopRef = useRef<(() => void) | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const historyRef = useRef<HistoryMessage[]>([]);
  const activeRef = useRef(false);  // shadow ref to read active in callbacks
  const tourGenerationRef = useRef(0);
  const micPermissionGrantedRef = useRef(false);
  const startingListenRef = useRef(false);
  const listenGenerationRef = useRef(0);
  const startListeningRef = useRef<(() => Promise<void>) | null>(null);

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
  const spokenCaptionRafRef = useRef<number | null>(null);
  const spokenCaptionGenerationRef = useRef(0);
  const speakingTextRef = useRef('');
  const handleUserTurnRef = useRef<UserTurnHandler | null>(null);

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
        case 'scrollProjectPreview':
          if (toolCallbacks?.scrollProjectPreview) {
            runTool('scrollProjectPreview', args, () => toolCallbacks.scrollProjectPreview!(args as { direction?: string }));
          } else {
            console.warn('[VoiceController] scrollProjectPreview tool called but no toolCallbacks.scrollProjectPreview provided');
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

  const clearAudioPlaybackGuard = () => {
    if (audioPlaybackGuardRef.current !== null) {
      clearTimeout(audioPlaybackGuardRef.current);
      audioPlaybackGuardRef.current = null;
    }
  };

  const abortActiveChatRequest = () => {
    if (chatTimeoutRef.current !== null) {
      clearTimeout(chatTimeoutRef.current);
      chatTimeoutRef.current = null;
    }
    try { chatAbortRef.current?.abort(); } catch {}
    chatAbortRef.current = null;
  };

  const clearInitialGreetTimer = useCallback(() => {
    if (initialGreetTimerRef.current !== null) {
      clearTimeout(initialGreetTimerRef.current);
      initialGreetTimerRef.current = null;
    }
  }, []);

  const stopBargeInMonitor = useCallback(() => {
    const stop = bargeInStopRef.current;
    bargeInStopRef.current = null;
    if (stop) {
      try { stop(); } catch {}
    }
  }, []);

  const stopSpokenCaptionProgress = useCallback((clearCaption = false) => {
    spokenCaptionGenerationRef.current += 1;
    if (spokenCaptionRafRef.current !== null) {
      cancelAnimationFrame(spokenCaptionRafRef.current);
      spokenCaptionRafRef.current = null;
    }
    if (clearCaption) setCaption('');
  }, []);

  const startTimedSpokenCaptionProgress = useCallback((text: string, durationSeconds?: number) => {
    stopSpokenCaptionProgress(false);

    const words = tokenizeSpeechWords(text);
    if (words.length === 0) {
      setCaption('');
      return;
    }

    const generation = spokenCaptionGenerationRef.current;
    const durationMs = Math.max(
      1000,
      Math.min(30000, Math.round((durationSeconds ?? Math.max(1, words.length * 0.42)) * 1000)),
    );
    const startedAt = performance.now();
    setCaption('Speaking\u2026');

    const tick = () => {
      if (generation !== spokenCaptionGenerationRef.current) return;
      const elapsed = performance.now() - startedAt;
      const progress = Math.min(1, elapsed / durationMs);
      const activeWordIndex = Math.min(words.length - 1, Math.floor(progress * words.length));
      setCaption(spokenCaptionWindow(words, activeWordIndex));

      if (progress < 1) {
        spokenCaptionRafRef.current = requestAnimationFrame(tick);
      } else {
        spokenCaptionRafRef.current = null;
      }
    };

    spokenCaptionRafRef.current = requestAnimationFrame(tick);
  }, [stopSpokenCaptionProgress]);

  const attachSynthSpokenCaptionProgress = useCallback((utterance: SpeechSynthesisUtterance, text: string) => {
    startTimedSpokenCaptionProgress(text, Math.min(30, Math.max(1, text.length * 0.05)) / 1.05);

    utterance.onboundary = (event) => {
      const words = tokenizeSpeechWords(text);
      if (words.length === 0) return;
      const activeWordIndex = wordIndexFromCharIndex(text, event.charIndex ?? 0);
      setCaption(spokenCaptionWindow(words, activeWordIndex));
    };
  }, [startTimedSpokenCaptionProgress]);

  // cancelAllAudio — single source of truth for stopping in-flight TTS, including
  // BufferSource playback, queued SpeechSynthesis utterances, and any /api/tts fetch
  // that is still in flight. Also unblocks any awaiter on speak() so old handleUserTurn
  // calls don't hang. Does NOT change VoiceBus state — the caller decides the new state.
  const cancelAllAudio = useCallback((options: { keepBargeInMonitor?: boolean } = {}) => {
    if (!options.keepBargeInMonitor) stopBargeInMonitor();
    stopSpokenCaptionProgress(true);

    // VOICE-06: clear Scribe stall guard so a stop-while-connecting doesn't
    // leave a 5s timer firing into a torn-down session.
    clearSessionGuard();

    // VOICE-07: clear synth fallback guard so a stop-during-speak doesn't
    // leave a stale timer firing into a torn-down speak() Promise.
    clearSynthGuard();
    clearAudioPlaybackGuard();

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
    speakingTextRef.current = '';
    speakingRef.current = false;
  }, [stopBargeInMonitor, stopSpokenCaptionProgress]);

  const startBargeInMonitor = useCallback(() => {
    if (micDenied) return;
    if (bargeInStopRef.current) return;
    if (typeof window === 'undefined') return;

    // Prefer content-gated barge-in: keep recognition armed during TTS, but only
    // interrupt once the user has said at least three words. This avoids noise
    // and one-word acknowledgements cutting Parz off.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionCtor) {
      let cancelled = false;
      let triggered = false;
      let completed = false;
      let lastTranscript = '';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let recognizer: any = null;

      const cleanup = () => {
        cancelled = true;
        if (recognizer) {
          try { recognizer.onresult = null; recognizer.onerror = null; recognizer.onend = null; } catch {}
          try { recognizer.abort(); } catch {}
        }
        recognizer = null;
        if (bargeInStopRef.current === cleanup) bargeInStopRef.current = null;
      };

      const finishBargeInTurn = (candidate: string) => {
        if (completed) return;
        const text = candidate.trim();
        completed = true;
        cleanup();
        if (!activeRef.current || tokenizeSpeechWords(text).length < VOICE_BARGE_IN_MIN_WORDS) {
          window.VoiceBus.setState('idle');
          return;
        }
        const handleTurn = handleUserTurnRef.current;
        if (handleTurn) void handleTurn(text);
        else window.VoiceBus.setState('idle');
      };

      recognizer = new SpeechRecognitionCtor();
      recognizer.continuous = false;
      recognizer.interimResults = true;
      recognizer.lang = 'en-US';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognizer.onresult = (ev: any) => {
        let interim = '';
        let finalText = '';
        for (let i = 0; i < ev.results.length; i++) {
          const result = ev.results[i];
          const text = result?.[0]?.transcript ?? '';
          if (result?.isFinal) finalText += text;
          else interim += text;
        }

        const transcript = (finalText || interim || lastTranscript).trim();
        const hasFinalText = finalText.trim().length > 0;
        if (transcript) lastTranscript = transcript;
        const isIntentionalBargeIn = isMobileBargeInContext()
          ? isMobileIntentionalBargeInTranscript(transcript, speakingTextRef.current, hasFinalText)
          : isIntentionalBargeInTranscript(transcript, speakingTextRef.current);
        if (
          !triggered &&
          isIntentionalBargeIn
        ) {
          triggered = true;
          turnGenerationRef.current += 1;
          cancelAllAudio({ keepBargeInMonitor: true });
          window.VoiceBus.setState('listening');
          setTranscript(transcript);
          setCaption(transcript);
        }

        if (triggered) {
          setTranscript(transcript);
          setCaption(transcript);
          if (finalText.trim()) finishBargeInTurn(finalText.trim());
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognizer.onerror = (e: any) => {
        if (cancelled) return;
        if (e?.error === 'not-allowed' || e?.error === 'service-not-allowed') {
          micPermissionGrantedRef.current = false;
          setMicDenied(true);
          cleanup();
          return;
        }
        if (
          !triggered &&
          activeRef.current &&
          speakingRef.current &&
          window.VoiceBus.state === 'speaking'
        ) {
          return;
        }
        if (triggered && lastTranscript) finishBargeInTurn(lastTranscript);
        else cleanup();
      };

      recognizer.onend = () => {
        if (cancelled) return;
        if (triggered) {
          finishBargeInTurn(lastTranscript);
          return;
        }
        if (activeRef.current && speakingRef.current && window.VoiceBus.state === 'speaking') {
          try { recognizer.start(); } catch { cleanup(); }
          return;
        }
        cleanup();
      };

      bargeInStopRef.current = cleanup;
      try {
        recognizer.start();
        return;
      } catch {
        cleanup();
      }
    }
  }, [cancelAllAudio, micDenied]);

  // stopAll — cancel all ongoing audio/speech/recognition
  const stopAll = useCallback(() => {
    clearInitialGreetTimer();
    const stoppedTourId = tourGenerationRef.current;
    tourGenerationRef.current += 1;
    if (stoppedTourId > 0) {
      window.VoiceBus.emit('site-control-tour-end', { tourId: stoppedTourId });
    }
    listenGenerationRef.current += 1;
    turnGenerationRef.current += 1;
    startingListenRef.current = false;
    abortActiveChatRequest();
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
  }, [cancelAllAudio, clearInitialGreetTimer]);

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
        speakingTextRef.current = text;

        window.VoiceBus.setState('speaking');
        setCaption('Speaking\u2026');

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
            if (ctx.state === 'suspended') {
              throw new Error('AudioContext still suspended');
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
            startTimedSpokenCaptionProgress(text, decoded.duration);

            // Start RMS loop — hooks live audio level into VoiceBus (per D-06)
            window.VoiceBus._startLoop(analyser, 1.4);

            const finishBufferPlayback = () => {
              // Identity check: only mutate state if THIS source is still current.
              // A cancelled source whose onended fires late must not touch state.
              if (audioSourceRef.current === source) {
                clearAudioPlaybackGuard();
                stopBargeInMonitor();
                stopSpokenCaptionProgress(true);
                window.VoiceBus._stopLoop();
                window.VoiceBus.setState('idle');
                speakingRef.current = false;
                audioSourceRef.current = null;
                speakAbortRef.current = null;
                if (speakResolverRef.current === resolve) speakResolverRef.current = null;
              }
              resolve();
            };

            source.onended = finishBufferPlayback;

            speakingRef.current = true;
            audioPlaybackGuardRef.current = setTimeout(() => {
              if (audioSourceRef.current !== source) return;
              try { source.stop(); } catch {}
              finishBufferPlayback();
            }, Math.round(decoded.duration * 1000) + VOICE_TTS_PLAYBACK_GUARD_BUFFER_MS);
            source.start();
            startBargeInMonitor();
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
            speakingTextRef.current = text;
            u.rate = 1.05;
            u.pitch = 1.0;
            u.volume = 1.0;
            speechUtteranceRef.current = u;
            window.VoiceBus.setState('speaking');
            window.VoiceBus.attachTTSFake(u);
            attachSynthSpokenCaptionProgress(u, text);
            const finishSynth = () => {
              if (speechUtteranceRef.current === u) {
                stopBargeInMonitor();
                stopSpokenCaptionProgress(true);
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
            startBargeInMonitor();
          });
      });
    },
    [
      attachSynthSpokenCaptionProgress,
      cancelAllAudio,
      startBargeInMonitor,
      startTimedSpokenCaptionProgress,
      stopBargeInMonitor,
      stopSpokenCaptionProgress,
    ]
  );

  // speak — public wrapper around streamTTS
  const speak = useCallback(
    (text: string): Promise<void> => {
      if (!text) return Promise.resolve();
      return streamTTS(text);
    },
    [streamTTS]
  );

  const resumeListeningIfActive = useCallback(() => {
    if (!activeRef.current) return;
    if (window.VoiceBus.state !== 'idle') return;
    const start = startListeningRef.current;
    if (start) void start();
  }, []);

  const waitForTourStep = useCallback((ms: number, tourId: number, turnId: number): Promise<boolean> => {
    return new Promise((resolve) => {
      window.setTimeout(() => {
        resolve(
          activeRef.current &&
          tourGenerationRef.current === tourId &&
          turnGenerationRef.current === turnId,
        );
      }, ms);
    });
  }, []);

  const startGuidedTour = useCallback(
    async (turnId: number) => {
      const tourId = ++tourGenerationRef.current;
      window.VoiceBus.emit('site-control-tour-start', { tourId });
      const shouldContinue = () =>
        activeRef.current &&
        tourGenerationRef.current === tourId &&
        turnGenerationRef.current === turnId;

      const pause = (ms: number) => waitForTourStep(ms, tourId, turnId);
      const act = async (name: string, args: Record<string, unknown> = {}, delayMs = 850) => {
        if (!shouldContinue()) return false;
        dispatchToolCall(name, args);
        return pause(delayMs);
      };
      const say = async (line: string) => {
        if (!shouldContinue()) return false;
        await speak(line);
        return shouldContinue();
      };

      try {
        if (!(await act('navigate', { page: 'portfolio' }, 900))) return;
        if (!(await say("Alright, here's the long version. This is not a static resume wall; it's the workbench version of the portfolio."))) return;

        if (!(await act('openProject', { slug: 'Review Gate' }, 1200))) return;
        if (!(await say("First stop: Review Gate. This one's very me: take a workflow that wastes requests, make the agent pause, and squeeze way more useful iteration out of the same session."))) return;
        if (!(await act('scrollProjectPreview', { direction: 'down' }, 900))) return;
        if (!(await say("The fun part is how practical it is: fewer dead-end AI sessions, more room to keep pushing inside the same request."))) return;
        if (!(await act('scrollProjectPreview', { direction: 'bottom' }, 900))) return;
        if (!(await say("The headline is simple: it turns the end of an AI coding request into a checkpoint instead of a dead stop. Less ceremony, more shipping."))) return;

        if (!(await act('closeBrowser', {}, 500))) return;
        if (!(await act('openProject', { slug: 'FSB' }, 1100))) return;
        if (!(await say("This is FSB, Full Self Browsing. It is the cleanest expression of the idea that AI control should feel tangible, bounded, and useful."))) return;

        if (!(await act('closeBrowser', {}, 500))) return;
        if (!(await act('openProject', { slug: 'GitFly' }, 1100))) return;
        if (!(await say("GitFly is the product-flavored side of the same obsession: AI-native dev workflows that feel current, fast, and practical. Public story only; the private source stays private."))) return;

        if (!(await act('closeBrowser', {}, 500))) return;
        if (!(await act('openProject', { slug: 'Parz-AI' }, 1100))) return;
        if (!(await say("And here's the bot-thread: Parz-AI. This is the older assistant work that fed into the portfolio voice layer you're using right now."))) return;
        if (!(await act('scrollProjectPreview', { direction: 'down' }, 800))) return;

        if (!(await act('closeBrowser', {}, 500))) return;
        if (!(await act('scrollTo', { selector: 'about' }, 1000))) return;
        if (!(await say("Now the human page. The short version: full-stack roots, then the AI rabbit hole, then a lot of stubborn systems work until the demos became actual tools."))) return;
        if (!(await act('scrollTo', { selector: 'experience' }, 900))) return;
        if (!(await say("Current chapter: AI Enablement Engineer at InfiniteChoice, building Voyza as an AI-first hotel booking platform. That's the public-safe version; the deeper product details stay where they belong."))) return;
        if (!(await act('scrollTo', { selector: 'academics' }, 900))) return;
        if (!(await say("That's the tour. If you want, interrupt me with any project name and I'll zoom into that instead."))) return;

        window.VoiceBus.setState('idle');
        setCaption('');
        setTranscript('');
        resumeListeningIfActive();
      } finally {
        window.VoiceBus.emit('site-control-tour-end', { tourId });
      }
    },
    [dispatchToolCall, resumeListeningIfActive, speak, waitForTourStep],
  );

  // handleUserTurn — ALL utterances go to Grok (except local stop for instant response).
  // The optional `greet` path drives the first speak-then-listen turn when
  // voice mode opens.
  // - kind 'user' (default): existing path. Utterance is the user's transcription.
  //   It IS appended to history and the LLM sees it as a real user turn.
  // - kind 'greet': utterance is a synthetic kickoff instruction (e.g. "[Voice mode
  //   just opened on the home page. Greet briefly...]"). It is NOT appended to history
  //   because the user never said it. Only the assistant's response goes to history.
  const handleUserTurn = useCallback(
    async (utterance: string, opts: { kind?: VoiceTurnKind } = {}) => {
      const kind = opts.kind ?? 'user';
      clearInitialGreetTimer();

      // Close Scribe connection immediately to prevent TTS echo feedback loop.
      // Without this, Scribe hears Parz's TTS response via the mic and transcribes
      // it as another user utterance, causing double/overlapping speech.
      try { connectionRef.current?.close(); } catch {}
      connectionRef.current = null;
      try { detachMicRef.current?.(); detachMicRef.current = null; } catch {}

      // Phase 22: cancel any in-flight TTS/fetch from a prior turn so a slow previous
      // response doesn't keep talking over this one. Closes overlap mode O-4.
      cancelAllAudio();
      const stoppedTourId = tourGenerationRef.current;
      tourGenerationRef.current += 1;
      if (stoppedTourId > 0) {
        window.VoiceBus.emit('site-control-tour-end', { tourId: stoppedTourId });
      }

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
        if (shouldPersistVoiceTurn(kind)) {
          historyRef.current = [
            ...historyRef.current,
            { role: 'user', content: utterance },
          ];
        }

        const baseMessages = historyRef.current.slice(-20).map((m) => ({
          id: Math.random().toString(36).slice(2),
          role: m.role as 'user' | 'assistant',
          content: m.content,
          parts: [{ type: 'text' as const, text: m.content }],
        }));

        // For greet: append the synthetic trigger as a one-shot user message
        // so the LLM has something to respond to. It is not in history.
        const messages = kind === 'greet'
          ? [
              ...baseMessages,
              {
                id: Math.random().toString(36).slice(2),
                role: 'user' as const,
                content: utterance,
                parts: [{ type: 'text' as const, text: utterance }],
              },
            ]
          : baseMessages;

        const streamState: VoiceStreamParseState = { responseText: '', toolCalls: [] };
        const chatAc = new AbortController();
        const chatTimeout = setTimeout(() => chatAc.abort(), VOICE_CHAT_RESPONSE_TIMEOUT_MS);
        abortActiveChatRequest();
        chatAbortRef.current = chatAc;
        chatTimeoutRef.current = chatTimeout;

        try {
          const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages, isVoice: true }),
            signal: chatAc.signal,
          });

          if (!res.ok) throw new Error(`/api/chat returned ${res.status}`);

          const reader = res.body?.getReader();
          const decoder = new TextDecoder();

          // F-01: keep a leftover buffer between reads so JSON events that span
          // chunk boundaries are not silently dropped by JSON.parse inside the catch.
          if (reader) {
            let buffer = '';
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                buffer += decoder.decode();
                if (buffer) parseVoiceStreamLine(buffer, streamState);
                break;
              }
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() ?? '';
              for (const line of lines) parseVoiceStreamLine(line, streamState);
            }
          }
        } finally {
          if (chatAbortRef.current === chatAc) chatAbortRef.current = null;
          if (chatTimeoutRef.current === chatTimeout) {
            clearTimeout(chatTimeout);
            chatTimeoutRef.current = null;
          }
        }

        const { toolCalls } = streamState;
        const clean = streamState.responseText.trim();
        let shouldStartTour = false;

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
              dispatchToolCall('navigate', tc.args);
              break;
            case 'openProject': {
              dispatchToolCall('openProject', { slug: (tc.args as { name: string }).name });
              break;
            }
            case 'scrollTo':
              dispatchToolCall('scrollTo', { selector: (tc.args as { section: string }).section });
              break;
            case 'scrollProjectPreview':
              dispatchToolCall('scrollProjectPreview', { direction: (tc.args as { direction?: string }).direction ?? 'down' });
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
            case 'startTour':
              shouldStartTour = kind === 'user' && isExplicitTourIntent(utterance);
              break;
            case 'switchToText': {
              const voiceSnapshot = buildVoiceSnapshot();
              stopAll();
              openTextChat(undefined, undefined, voiceSnapshot);
              activeRef.current = false;
              setActive(false);
              return; // Don't speak after switching to text
            }
            case 'endCall':
              if (clean) await speak(clean);
              stopAll();
              activeRef.current = false;
              setActive(false);
              return; // Don't speak again after ending
          }
        }

        // Speak the text response (if any). If the model only emitted tool calls,
        // return to listening after those actions. If there is neither text nor
        // tools, stop at idle with a visible caption instead of silently looping
        // back into listening.
        if (clean) {
          await speak(clean);
          if (myTurn !== turnGenerationRef.current) return;
          if (shouldStartTour) {
            await startGuidedTour(myTurn);
            return;
          }
          resumeListeningIfActive();
        } else if (shouldStartTour) {
          await startGuidedTour(myTurn);
        } else if (toolCalls.length > 0) {
          window.VoiceBus.setState('idle');
          setCaption('');
          resumeListeningIfActive();
        } else {
          window.VoiceBus.setState('idle');
          setCaption("I couldn't get a spoken response. Tap to try again.");
        }
      } catch {
        if (myTurn !== turnGenerationRef.current) return;
        // Surface a UI caption and stop at idle. Auto-resuming here creates the
        // confusing listening/thinking loop when /api/chat or /api/tts is blocked.
        window.VoiceBus.setState('idle');
        setCaption('Voice connection hiccup. Tap to try again.');
      }
    },
    [
      openTextChat,
      speak,
      stopAll,
      dispatchToolCall,
      cancelAllAudio,
      clearInitialGreetTimer,
      resumeListeningIfActive,
      buildVoiceSnapshot,
      startGuidedTour,
    ]
  );

  handleUserTurnRef.current = handleUserTurn;

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
    stopBargeInMonitor();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = new SR() as any;
    r.continuous = false;
    r.interimResults = true;
    r.lang = 'en-US';

    r.onstart = () => {
      micPermissionGrantedRef.current = true;
      setMicDenied(false);
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
        micPermissionGrantedRef.current = false;
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
        setCaption('');
      }
    };

    connectionRef.current = r as unknown as RealtimeConnection;
    try { r.start(); } catch (e) {
      setCaption("Couldn't start mic: " + (e as Error).message);
    }
  }, [handleUserTurn, stopBargeInMonitor]);

  // startListening — ElevenLabs Scribe v2 primary STT, Web Speech API fallback (per D-01, D-02)
  const startListening = useCallback(async () => {
    if (startingListenRef.current || window.VoiceBus.state === 'listening') return;
    startingListenRef.current = true;
    const myListen = ++listenGenerationRef.current;
    stopBargeInMonitor();
    window.VoiceBus.setState('listening');
    setCaption('Listening\u2026');

    // Create sttCtx BEFORE first await — keeps creation in user gesture frame
    // (RESEARCH.md Pitfall 3: AudioContext autoplay policy blocks creation after await)
    // Per D-06: separate 16kHz AudioContext avoids TTS echo on VoiceBus._ctx
    let sttCtx: AudioContext | null = new AudioContext({ sampleRate: 16000 });

    try {
      // 1. Fetch single-use token — never cache, fresh per session (per D-03, D-04)
      const res = await fetch('/api/stt-token', { method: 'POST' });
      if (!res.ok) throw new Error(`stt-token ${res.status}`);
      const { token } = await res.json() as { token: string };
      if (myListen !== listenGenerationRef.current || !activeRef.current) {
        sttCtx.close().catch(() => {});
        sttCtx = null;
        return;
      }

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
        if (myListen !== listenGenerationRef.current || !activeRef.current) {
          try { connection.close(); } catch {}
          return;
        }
        clearSessionGuard();
        micPermissionGrantedRef.current = true;
        setMicDenied(false);
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
        micPermissionGrantedRef.current = false;
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
        sttCtx?.close().catch(() => {});
        sttCtx = null;
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
      sttCtx?.close().catch(() => {});
      sttCtx = null;
      if (myListen === listenGenerationRef.current && activeRef.current) {
        startListeningFallback();
      }
    } finally {
      if (myListen === listenGenerationRef.current) {
        startingListenRef.current = false;
      }
    }
  }, [handleUserTurn, startListeningFallback, stopBargeInMonitor]);

  startListeningRef.current = startListening;

  const startManualListening = useCallback(() => {
    clearInitialGreetTimer();
    turnGenerationRef.current += 1;
    if (speakingRef.current || window.VoiceBus.state === 'speaking' || window.VoiceBus.state === 'thinking') {
      cancelAllAudio();
    }
    void startListening();
  }, [cancelAllAudio, clearInitialGreetTimer, startListening]);

  // open — activate voice mode and let Parz speak first. The synthetic greet
  // turn is LLM-generated, then normal flow resumes listening after TTS ends.
  // Phase 23 hotfix: pre-warm the VoiceBus AudioContext synchronously inside
  // the click gesture frame. Without this, the first speak()'s streamTTS tries
  // to create the context inside its fetch .then chain — long after the click
  // gesture has expired — and the browser autoplay policy keeps the context
  // suspended. A suspended context lets source.start() succeed silently but
  // never fires onended, so state hangs in 'speaking' and Parz appears mute.
  // Calling _getCtx() inside the gesture creates (or resumes) the context now.
  const open = useCallback(() => {
    clearInitialGreetTimer();
    activeRef.current = true;
    setActive(true);
    setCaption('');
    setTranscript('');
    if (typeof window !== 'undefined' && window.VoiceBus) {
      try { window.VoiceBus._getCtx(); } catch {}
    }
    initialGreetTimerRef.current = setTimeout(() => {
      initialGreetTimerRef.current = null;
      if (!activeRef.current) return;
      if (speakingRef.current) return;
      if (typeof window !== 'undefined' && window.VoiceBus && window.VoiceBus.state !== 'idle') return;
      const trigger = buildVoiceOpeningPrompt(currentPage ?? 'home');
      void handleUserTurn(trigger, { kind: 'greet' });
    }, VOICE_OPEN_GREETING_DELAY_MS);
  }, [clearInitialGreetTimer, currentPage, handleUserTurn]);

  // close — stop all audio and persist history to localStorage (per D-22)
  const close = useCallback(() => {
    activeRef.current = false;
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
        startManualListening();
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
  }, [active, startManualListening, close]);

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
      onMic: voiceState === 'listening' ? stopAll : startManualListening,
      onStop: stopAll,
      onClose: close,
      onFallbackChat: (originRect?: ChatMorphRect, voiceSnapshot?: ChatVoiceSnapshot) => {
        const snapshot = voiceSnapshot ?? buildVoiceSnapshot();
        stopAll();
        openTextChat(undefined, originRect, snapshot);
        activeRef.current = false;
        setActive(false);
      },
    },
  };
}
