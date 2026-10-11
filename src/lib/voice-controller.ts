'use client';

// src/lib/voice-controller.ts
// Full voice session state machine — Grok Voice speech-to-speech with the custom
// voice, site-control tool calls, guided tours, and accessibility shortcuts.

import { useState, useEffect, useRef, useCallback } from 'react';
import { isStopIntent } from './voice-commands';
import {
  spokenCaptionWindow,
  tokenizeSpeechWords,
  wordIndexFromCharIndex,
} from './voice-caption-window';
import {
  buildToolFallbackSpeech,
  buildVoiceOpeningPrompt,
  chunkForTTS,
  isIntentionalBargeInTranscript,
  shouldPersistVoiceTurn,
  VOICE_BARGE_IN_MIN_WORDS,
  VOICE_OPEN_GREETING_DELAY_MS,
  VOICE_TTS_CHUNK_MAX_CHARS,
  type VoiceTurnKind,
} from './voice-turn-policy';
import { calculateRms, VoiceBargeInDetector } from './voice-barge-in';
import { pickTourNarration } from '@/data/tour-narration';
import type { ChatMorphRect, ChatVoiceSnapshot } from '@/lib/chat-morph';
import {
  fetchGrokVoiceGrant,
  GrokVoiceSession,
  type GrokVoiceResponse,
} from '@/lib/grok-voice-session';
import { GROK_VOICE_SAMPLE_RATE } from '@/lib/grok-voice-tools';
import type { ControlResult } from '@/providers/site-control-provider';

const VOICE_CHAT_RESPONSE_TIMEOUT_MS = 35000;
const VOICE_TTS_PLAYBACK_GUARD_BUFFER_MS = 1750;
const VOICE_BARGE_IN_ANALYSER_FFT_SIZE = 1024;
const VOICE_BARGE_IN_NEAR_END_WINDOW_MS = 1200;
const VOICE_BARGE_IN_ANALYSER_SETUP_TIMEOUT_MS = 1200;

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

function buildBargeInAudioConstraints(): MediaTrackConstraints {
  const constraints: MediaTrackConstraints & { echoCancellation?: boolean | string } = {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  };
  const supported = navigator.mediaDevices?.getSupportedConstraints?.();
  if (supported?.echoCancellation) constraints.echoCancellation = 'all';
  return constraints as MediaTrackConstraints;
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
  const connectionRef = useRef<{ close: () => void } | null>(null);
  const grokSessionRef = useRef<GrokVoiceSession | null>(null);
  const grokConnectRef = useRef<Promise<GrokVoiceSession | null> | null>(null);
  const playbackCtxRef = useRef<AudioContext | null>(null);
  const micCtxRef = useRef<AudioContext | null>(null);
  const turnKindRef = useRef<VoiceTurnKind>('user');
  const onGrokResponseRef = useRef<(response: GrokVoiceResponse) => void>(() => {});
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
  // speakAbortRef is retained so a cancelled speak cannot resume an older turn.
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

  // History is per-page-session only — no cross-reload caching. historyRef
  // lives in memory and resets to [] every time the component mounts (i.e.,
  // every page reload). Clear any legacy pf-voice-history entry from prior
  // builds so the first reload after the change wipes the cache cleanly.
  // Also closes the privacy gap flagged in .planning/research/PITFALLS.md:246
  // (sensitive content used to linger in localStorage across sessions).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try { localStorage.removeItem('pf-voice-history'); } catch {}
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
    // Why: ElevenLabs audio buffer playback has a small pre-roll between
    // source.start() and the first audible word (buffer hand-off, output
    // latency, etc.). Without a matching delay the caption window advances
    // first and the rightmost word appears on screen ~150-250ms before the
    // user hears it. Letting captions trail by a beat — clamped to 5% of the
    // chunk so a 1s chunk doesn't sit on word #0 for half its length — makes
    // them read like subtitles instead of leading the voice.
    const captionHeadStartMs = Math.min(220, Math.max(80, Math.round(durationMs * 0.05)));
    const startedAt = performance.now();
    setCaption('Speaking\u2026');

    const tick = () => {
      if (generation !== spokenCaptionGenerationRef.current) return;
      const elapsedRaw = performance.now() - startedAt;
      const elapsed = Math.max(0, elapsedRaw - captionHeadStartMs);
      const effectiveDurationMs = Math.max(1, durationMs - captionHeadStartMs);
      const progress = Math.min(1, elapsed / effectiveDurationMs);
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

  // cancelAllAudio — stops Grok Voice playback and any local caption timer.
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

    // Stop Grok Voice playback without dropping the realtime socket.
    try { grokSessionRef.current?.interrupt(); } catch {}
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
    // Barge-in is fully disabled on every viewport: desktop browsers were also
    // hearing Parz's TTS through the speaker, and the transcript echo gate
    // could not reliably reject ASR-mangled echoes — Parz kept cutting itself
    // off mid-sentence. The user-initiated cancel path (stop button, mic
    // toggle, new turn via cancelAllAudio) is unaffected.
    return;

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
      let pendingIntentionalTranscript = '';
      let nearEndSpeechUntilMs = 0;
      let gateMode: 'pending' | 'hybrid' | 'transcript-only' = 'pending';
      let analyserRaf: number | null = null;
      let analyserCleanup: (() => void) | null = null;
      let analyserSetupTimer: ReturnType<typeof setTimeout> | null = null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let recognizer: any = null;

      const cleanup = () => {
        cancelled = true;
        if (analyserSetupTimer !== null) {
          clearTimeout(analyserSetupTimer);
          analyserSetupTimer = null;
        }
        if (analyserRaf !== null) {
          cancelAnimationFrame(analyserRaf);
          analyserRaf = null;
        }
        if (analyserCleanup) {
          try { analyserCleanup(); } catch {}
          analyserCleanup = null;
        }
        if (recognizer) {
          try { recognizer.onresult = null; recognizer.onerror = null; recognizer.onend = null; } catch {}
          try { recognizer.abort(); } catch {}
        }
        recognizer = null;
        if (bargeInStopRef.current === cleanup) bargeInStopRef.current = null;
      };

      const beginBargeIn = (candidate: string) => {
        if (triggered || completed) return;
        triggered = true;
        turnGenerationRef.current += 1;
        cancelAllAudio({ keepBargeInMonitor: true });
        window.VoiceBus.setState('listening');
        setTranscript(candidate);
        setCaption(candidate);
      };

      const enableTranscriptOnlyFallback = () => {
        if (cancelled || triggered) return;
        if (analyserSetupTimer !== null) {
          clearTimeout(analyserSetupTimer);
          analyserSetupTimer = null;
        }
        gateMode = 'transcript-only';
        if (pendingIntentionalTranscript) beginBargeIn(pendingIntentionalTranscript);
      };

      const maybeStartBargeIn = (candidate: string) => {
        if (triggered || completed) return;
        pendingIntentionalTranscript = candidate;
        if (gateMode === 'transcript-only' || performance.now() <= nearEndSpeechUntilMs) {
          beginBargeIn(candidate);
        }
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

      analyserSetupTimer = setTimeout(
        enableTranscriptOnlyFallback,
        VOICE_BARGE_IN_ANALYSER_SETUP_TIMEOUT_MS,
      );

      void (async () => {
        if (!navigator.mediaDevices?.getUserMedia) {
          enableTranscriptOnlyFallback();
          return;
        }

        let stream: MediaStream | null = null;
        let source: MediaStreamAudioSourceNode | null = null;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: buildBargeInAudioConstraints(),
          });
          if (cancelled || (gateMode as string) === 'transcript-only') {
            stream.getTracks().forEach((track) => track.stop());
            return;
          }

          const ctx = window.VoiceBus._getCtx();
          if (!ctx) throw new Error('AudioContext unavailable');
          if (ctx.state === 'suspended') {
            try { await ctx.resume(); } catch {}
          }
          if (ctx.state === 'suspended') throw new Error('AudioContext still suspended');

          const analyser = ctx.createAnalyser();
          analyser.fftSize = VOICE_BARGE_IN_ANALYSER_FFT_SIZE;
          source = ctx.createMediaStreamSource(stream);
          source.connect(analyser);

          const detector = new VoiceBargeInDetector();
          const buffer = new Uint8Array(analyser.fftSize);
          detector.reset(performance.now());
          gateMode = 'hybrid';
          if (analyserSetupTimer !== null) {
            clearTimeout(analyserSetupTimer);
            analyserSetupTimer = null;
          }

          analyserCleanup = () => {
            if (source) {
              try { source.disconnect(); } catch {}
              source = null;
            }
            if (stream) {
              stream.getTracks().forEach((track) => track.stop());
              stream = null;
            }
          };

          const sample = () => {
            if (cancelled) return;
            const now = performance.now();
            analyser.getByteTimeDomainData(buffer);
            if (detector.sample({ rms: calculateRms(buffer), nowMs: now })) {
              nearEndSpeechUntilMs = now + VOICE_BARGE_IN_NEAR_END_WINDOW_MS;
              if (pendingIntentionalTranscript) beginBargeIn(pendingIntentionalTranscript);
            }
            analyserRaf = requestAnimationFrame(sample);
          };
          analyserRaf = requestAnimationFrame(sample);
        } catch {
          if (source) {
            try { source.disconnect(); } catch {}
          }
          if (stream) stream.getTracks().forEach((track) => track.stop());
          enableTranscriptOnlyFallback();
        }
      })();

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
        if (transcript) lastTranscript = transcript;
        const isIntentionalBargeIn = isIntentionalBargeInTranscript(
          transcript,
          speakingTextRef.current,
        );
        if (!triggered && isIntentionalBargeIn) maybeStartBargeIn(transcript);

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
    try { grokSessionRef.current?.close(); } catch {}
    grokSessionRef.current = null;
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

  const ensureGrokSession = useCallback(async (): Promise<GrokVoiceSession | null> => {
    if (grokSessionRef.current) return grokSessionRef.current;
    if (grokConnectRef.current) return grokConnectRef.current;

    const connect = (async () => {
      const AC = window.AudioContext
        || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) throw new Error('AudioContext unavailable');
      if (!playbackCtxRef.current) playbackCtxRef.current = new AC({ sampleRate: GROK_VOICE_SAMPLE_RATE });
      if (!micCtxRef.current) micCtxRef.current = new AC({ sampleRate: GROK_VOICE_SAMPLE_RATE });
      void playbackCtxRef.current.resume();
      void micCtxRef.current.resume();

      let micGranted = true;
      const grant = await fetchGrokVoiceGrant();
      if (!activeRef.current) return null;
      const session = await GrokVoiceSession.connect(
        grant,
        {
          onUserTranscript: (text) => {
            turnKindRef.current = 'user';
            setTranscript(text);
            const words = tokenizeSpeechWords(text);
            setCaption(spokenCaptionWindow(words, Math.max(0, words.length - 1)));
          },
          onAssistantTranscript: (text) => {
            const words = tokenizeSpeechWords(text);
            setCaption(spokenCaptionWindow(words, Math.max(0, words.length - 1)));
          },
          onResponse: (response) => {
            onGrokResponseRef.current(response);
          },
          onBargeIn: () => {
            turnKindRef.current = 'user';
            turnGenerationRef.current += 1;
            const stoppedTourId = tourGenerationRef.current;
            tourGenerationRef.current += 1;
            if (stoppedTourId > 0) {
              window.VoiceBus.emit('site-control-tour-end', { tourId: stoppedTourId });
            }
            window.VoiceBus.setState('listening');
            setCaption('Listening\u2026');
          },
          onError: (message) => {
            if (/cancel/i.test(message)) return;
            console.warn('[VoiceTrace] grok voice error', message);
            window.VoiceBus.setState('idle');
          },
          onPlaybackStart: (analyser) => {
            window.VoiceBus.setState('speaking');
            window.VoiceBus._startLoop(analyser, 1.4);
            speakingRef.current = true;
          },
          onPlaybackIdle: () => {
            window.VoiceBus._stopLoop();
            speakingRef.current = false;
          },
          onMicDenied: () => {
            micGranted = false;
            micPermissionGrantedRef.current = false;
            setMicDenied(true);
            setCaption('Mic access denied. Click to retry.');
          },
        },
        playbackCtxRef.current,
        micCtxRef.current,
      );

      if (!activeRef.current) {
        session.close();
        return null;
      }
      grokSessionRef.current = session;
      connectionRef.current = { close: () => session.close() };
      if (micGranted) {
        micPermissionGrantedRef.current = true;
        setMicDenied(false);
      }
      return session;
    })();

    grokConnectRef.current = connect;
    try {
      return await connect;
    } finally {
      if (grokConnectRef.current === connect) grokConnectRef.current = null;
    }
  }, []);

  // speak — scripted lines (tour narration) go through Grok Voice force_message
  // so they use the same custom voice as the live conversation.
  const speak = useCallback(
    async (text: string): Promise<void> => {
      if (!text) return;
      const session = grokSessionRef.current ?? await ensureGrokSession();
      if (!session) return;
      window.VoiceBus.setState('speaking');
      speakingTextRef.current = text;
      speakingRef.current = true;
      const words = tokenizeSpeechWords(text);
      setCaption(spokenCaptionWindow(words, 0));
      startTimedSpokenCaptionProgress(text, Math.max(1, text.length * 0.06));
      try {
        session.interrupt();
        await session.speakVerbatim(text);
      } catch {
        // Interrupted, timed out, or the socket closed. The caller checks turn generation.
      } finally {
        stopSpokenCaptionProgress(true);
        speakingRef.current = false;
        speakingTextRef.current = '';
      }
    },
    [ensureGrokSession, startTimedSpokenCaptionProgress, stopSpokenCaptionProgress],
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

      // Pick a narration variant per tour run so repeat visitors get slight
      // wording variation. The tool-call sequence below stays identical —
      // contract-locked by tests/voice-barge-in.test.ts:736-756.
      const narration = pickTourNarration();

      try {
        if (!(await act('navigate', { page: 'portfolio' }, 900))) return;
        if (!(await say(narration.opener))) return;

        if (!(await act('openProject', { slug: 'Review Gate' }, 1200))) return;
        if (!(await say(narration.reviewGateIntro))) return;
        if (!(await act('scrollProjectPreview', { direction: 'down' }, 900))) return;
        if (!(await say(narration.reviewGateMid))) return;
        if (!(await act('scrollProjectPreview', { direction: 'bottom' }, 900))) return;
        if (!(await say(narration.reviewGateClose))) return;

        if (!(await act('closeBrowser', {}, 500))) return;
        if (!(await act('openProject', { slug: 'FSB' }, 1100))) return;
        if (!(await say(narration.fsb))) return;

        if (!(await act('closeBrowser', {}, 500))) return;
        if (!(await act('openProject', { slug: 'GitFly' }, 1100))) return;
        if (!(await say(narration.gitFly))) return;

        if (!(await act('closeBrowser', {}, 500))) return;
        if (!(await act('openProject', { slug: 'Parz-AI' }, 1100))) return;
        if (!(await say(narration.parzAi))) return;
        if (!(await act('scrollProjectPreview', { direction: 'down' }, 800))) return;

        if (!(await act('closeBrowser', {}, 500))) return;
        if (!(await act('scrollTo', { selector: 'about' }, 1000))) return;
        if (!(await say(narration.aboutIntro))) return;
        if (!(await act('scrollTo', { selector: 'experience' }, 900))) return;
        if (!(await say(narration.experience))) return;
        if (!(await act('scrollTo', { selector: 'academics' }, 900))) return;
        if (!(await say(narration.signoff))) return;

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

  const applyIncomingTools = useCallback(
    async (response: GrokVoiceResponse) => {
      const myTurn = turnGenerationRef.current;
      const kind = turnKindRef.current;
      const session = grokSessionRef.current;
      try {
        const { toolCalls } = response;
        const clean = response.transcript.trim();
        let shouldStartTour = false;

        if (clean) {
          historyRef.current = [
            ...historyRef.current,
            { role: 'assistant', content: clean },
          ];
        }

        for (const tc of toolCalls) {
          session?.submitToolOutput(tc.callId, { ok: true, tool: tc.name });
          switch (tc.name) {
            case 'navigate':
              dispatchToolCall('navigate', tc.args);
              break;
            case 'openProject':
              dispatchToolCall('openProject', { slug: String(tc.args.name ?? tc.args.slug ?? '') });
              break;
            case 'scrollTo':
              dispatchToolCall('scrollTo', { selector: String(tc.args.section ?? tc.args.selector ?? '') });
              break;
            case 'scrollProjectPreview':
              dispatchToolCall('scrollProjectPreview', { direction: typeof tc.args.direction === 'string' ? tc.args.direction : 'down' });
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
              // Trust Grok's tool-call decision. Synthetic greet kickoffs are not
              // real user utterances and should never run a tour.
              shouldStartTour = kind === 'user';
              break;
            case 'switchToText': {
              const voiceSnapshot = buildVoiceSnapshot();
              stopAll();
              openTextChat(undefined, undefined, voiceSnapshot);
              activeRef.current = false;
              setActive(false);
              return;
            }
            case 'endCall':
              if (clean) await speak(clean);
              stopAll();
              activeRef.current = false;
              setActive(false);
              return;
            default:
              break;
          }
        }

        if (myTurn !== turnGenerationRef.current) return;

        if (toolCalls.length > 0 && !shouldStartTour) {
          await session?.waitForPlayback();
          if (myTurn !== turnGenerationRef.current) return;
          if (!clean && !response.hadAudio) {
            const fallback = buildToolFallbackSpeech(toolCalls) || 'Got it.';
            await speak(fallback);
            if (myTurn !== turnGenerationRef.current) return;
            historyRef.current = [
              ...historyRef.current,
              { role: 'assistant', content: fallback },
            ];
          }
          window.VoiceBus.setState('idle');
          setCaption('');
          resumeListeningIfActive();
          return;
        }

        if (clean || response.hadAudio) {
          if (shouldStartTour) {
            await session?.waitForPlayback();
            if (myTurn !== turnGenerationRef.current) return;
            await startGuidedTour(myTurn);
            return;
          }
          await session?.waitForPlayback();
          if (myTurn !== turnGenerationRef.current) return;
          window.VoiceBus.setState('idle');
          resumeListeningIfActive();
        } else if (shouldStartTour) {
          await startGuidedTour(myTurn);
        } else {
          window.VoiceBus.setState('idle');
          setCaption("I couldn't get a spoken response. Tap to try again.");
        }
      } catch {
        if (myTurn !== turnGenerationRef.current) return;
        window.VoiceBus.setState('idle');
        setCaption('Voice connection hiccup. Tap to try again.');
      }
    },
    [
      buildVoiceSnapshot,
      dispatchToolCall,
      openTextChat,
      resumeListeningIfActive,
      speak,
      startGuidedTour,
      stopAll,
    ],
  );

  onGrokResponseRef.current = (response) => {
    void applyIncomingTools(response);
  };

  // handleUserTurn — text kickoffs (the opening greet, stop intent, and any
  // leftover typed utterance) enter the live Grok Voice session. Spoken user
  // audio is handled by the realtime socket itself.
  const handleUserTurn = useCallback(
    async (utterance: string, opts: { kind?: VoiceTurnKind } = {}) => {
      const kind = opts.kind ?? 'user';
      turnKindRef.current = kind;
      clearInitialGreetTimer();

      const stoppedTourId = tourGenerationRef.current;
      tourGenerationRef.current += 1;
      if (stoppedTourId > 0) {
        window.VoiceBus.emit('site-control-tour-end', { tourId: stoppedTourId });
      }

      turnGenerationRef.current += 1;
      const myTurn = turnGenerationRef.current;

      if (kind === 'user') {
        const u = utterance.toLowerCase();
        if (isStopIntent(u)) {
          stopAll();
          return;
        }
      }

      window.VoiceBus.setState('thinking');
      setCaption('Thinking\u2026');

      try {
        if (shouldPersistVoiceTurn(kind)) {
          historyRef.current = [
            ...historyRef.current,
            { role: 'user', content: utterance },
          ];
        }
        const session = await ensureGrokSession();
        if (myTurn !== turnGenerationRef.current || !session) return;
        session.sendUserText(utterance);
      } catch {
        if (myTurn !== turnGenerationRef.current) return;
        window.VoiceBus.setState('idle');
        setCaption('Voice connection hiccup. Tap to try again.');
      }
    },
    [clearInitialGreetTimer, ensureGrokSession, stopAll],
  );

  handleUserTurnRef.current = handleUserTurn;

  const startListening = useCallback(async () => {
    if (startingListenRef.current || window.VoiceBus.state === 'listening') return;
    startingListenRef.current = true;
    const myListen = ++listenGenerationRef.current;
    window.VoiceBus.setState('listening');
    setCaption('Listening\u2026');
    try {
      const session = await ensureGrokSession();
      if (myListen !== listenGenerationRef.current || !activeRef.current || !session) {
        if (myListen === listenGenerationRef.current) window.VoiceBus.setState('idle');
        return;
      }
      window.VoiceBus.setState('listening');
    } catch {
      if (myListen !== listenGenerationRef.current) return;
      window.VoiceBus.setState('idle');
      setCaption('Voice connection hiccup. Tap to try again.');
    } finally {
      if (myListen === listenGenerationRef.current) startingListenRef.current = false;
    }
  }, [ensureGrokSession]);

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
    if (typeof window !== 'undefined') {
      const AudioContextCtor = window.AudioContext
        || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioContextCtor) {
        if (!playbackCtxRef.current) {
          playbackCtxRef.current = new AudioContextCtor({ sampleRate: GROK_VOICE_SAMPLE_RATE });
        }
        if (!micCtxRef.current) {
          micCtxRef.current = new AudioContextCtor({ sampleRate: GROK_VOICE_SAMPLE_RATE });
        }
        void playbackCtxRef.current.resume();
        void micCtxRef.current.resume();
      }
      if (window.VoiceBus) {
        try { window.VoiceBus._getCtx(); } catch {}
      }
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

  // close — stop all audio. History is intentionally NOT persisted to
  // localStorage: every page reload starts a fresh conversation. The
  // in-memory historyRef still survives a close/reopen within the same
  // page session so context is preserved across mid-session toggles.
  const close = useCallback(() => {
    activeRef.current = false;
    stopAll();
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
      if (e.code !== 'Space' || isTypingTarget(e.target)) return;
      // Server VAD owns turn taking. Releasing Space must not hang up the session.
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
