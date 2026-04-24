// src/types/voice-bus.d.ts
// Per D-08: TypeScript declarations for window.VoiceBus

declare global {
  type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

  interface VoiceBusInstance {
    state: VoiceState;
    level: number;
    _liveAudio: boolean;
    _raf: number | null;
    _ctx: AudioContext | null;
    on(evt: string, fn: (payload: unknown) => void): () => void;
    off(evt: string, fn: (payload: unknown) => void): void;
    emit(evt: string, payload?: unknown): void;
    setState(s: VoiceState): void;
    setLevel(n: number): void;
    _getCtx(): AudioContext | null;
    _startLoop(analyser: AnalyserNode, gain?: number): void;
    _stopLoop(): void;
    attachMic(): Promise<() => void>;
    attachTTSFake(utterance: SpeechSynthesisUtterance): () => void;
  }

  interface Window {
    VoiceBus: VoiceBusInstance;
  }
}
export {};
