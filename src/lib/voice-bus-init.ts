// src/lib/voice-bus-init.ts
// Per D-07, D-08: Port of the VoiceBus IIFE from voice_mode.jsx to a named export.
// No module imports — uses only window globals and browser APIs.
// Call once at module scope in voice-bus-provider.tsx to guarantee init before any
// React tree mounts.

export function initVoiceBus(): void {
  if (typeof window === 'undefined' || window.VoiceBus) return;

  const listeners = new Map<string, Set<(p: unknown) => void>>();

  window.VoiceBus = {
    state: 'idle',
    level: 0,
    _liveAudio: false,
    _raf: null,
    _ctx: null,

    on(evt: string, fn: (payload: unknown) => void): () => void {
      if (!listeners.has(evt)) listeners.set(evt, new Set());
      listeners.get(evt)!.add(fn);
      return () => window.VoiceBus.off(evt, fn);
    },

    off(evt: string, fn: (payload: unknown) => void): void {
      listeners.get(evt)?.delete(fn);
    },

    emit(evt: string, p?: unknown): void {
      listeners.get(evt)?.forEach((fn) => {
        try {
          fn(p);
        } catch (e) {
          console.error(e);
        }
      });
    },

    setState(s: VoiceState): void {
      if (window.VoiceBus.state === s) return;
      window.VoiceBus.state = s;
      window.VoiceBus.emit('state', s);
      // Only set a fallback level if we're not actively analysing live audio.
      if (!window.VoiceBus._liveAudio) {
        const d: Record<VoiceState, number> = {
          idle: 0,
          listening: 0.35,
          thinking: 0.55,
          speaking: 0.75,
        };
        if (s in d) window.VoiceBus.setLevel(d[s]);
      }
    },

    setLevel(n: number): void {
      const v = Math.max(0, Math.min(1, n));
      if (Math.abs(v - window.VoiceBus.level) < 0.001) return;
      window.VoiceBus.level = v;
      window.VoiceBus.emit('level', v);
    },

    _getCtx(): AudioContext | null {
      if (!window.VoiceBus._ctx) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const AC = window.AudioContext || (window as any).webkitAudioContext;
        if (!AC) return null;
        window.VoiceBus._ctx = new AC();
      }
      if (window.VoiceBus._ctx!.state === 'suspended') {
        window.VoiceBus._ctx!.resume().catch(() => {});
      }
      return window.VoiceBus._ctx;
    },

    _startLoop(analyser: AnalyserNode, gain = 1.4): void {
      window.VoiceBus._liveAudio = true;
      const buf = new Uint8Array(analyser.fftSize);
      let smoothed = 0;
      const tick = () => {
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / buf.length);
        // Ease-out smoothing so the wave doesn't jitter.
        const target = Math.min(1, rms * gain * 3.5);
        smoothed = smoothed + (target - smoothed) * 0.25;
        window.VoiceBus.setLevel(smoothed);
        window.VoiceBus._raf = requestAnimationFrame(tick);
      };
      window.VoiceBus._raf = requestAnimationFrame(tick);
    },

    _stopLoop(): void {
      if (window.VoiceBus._raf) cancelAnimationFrame(window.VoiceBus._raf);
      window.VoiceBus._raf = null;
      window.VoiceBus._liveAudio = false;
      window.VoiceBus.setLevel(0);
    },

    async attachMic(): Promise<() => void> {
      const ctx = window.VoiceBus._getCtx();
      if (!ctx) return () => {};
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        src.connect(analyser);
        window.VoiceBus._stopLoop();
        window.VoiceBus._startLoop(analyser, 1.2);
        return () => {
          try { stream.getTracks().forEach((t) => t.stop()); } catch {}
          try { src.disconnect(); } catch {}
          window.VoiceBus._stopLoop();
        };
      } catch (e) {
        console.warn('mic attach failed', e);
        return () => {};
      }
    },

    // attachTTSFake wraps a SpeechSynthesisUtterance and fakes amplitude since the
    // WebSpeech TTS stream isn't directly routable. Synthesizes plausible speech-shaped
    // amplitude envelopes based on an internal clock — gate (3.3 Hz) × syll (13.0 Hz) × noise (27 Hz).
    attachTTSFake(utterance: SpeechSynthesisUtterance): () => void {
      let running = true;
      const start = performance.now();
      window.VoiceBus._liveAudio = true;
      const tick = () => {
        if (!running) return;
        const t = (performance.now() - start) / 1000;
        // envelope: slow gate (word boundaries) × fast jitter (syllables)
        const gate = 0.5 + 0.5 * Math.sin(t * 3.3);
        const syll = 0.5 + 0.5 * Math.sin(t * 13.0 + Math.sin(t * 2.1) * 2);
        const noise = 0.5 + 0.5 * Math.sin(t * 27 + 1.3);
        const v = Math.max(0.1, Math.min(1, gate * 0.6 + syll * 0.35 + noise * 0.08));
        window.VoiceBus.setLevel(v);
        window.VoiceBus._raf = requestAnimationFrame(tick);
      };
      window.VoiceBus._raf = requestAnimationFrame(tick);
      const stop = () => {
        running = false;
        window.VoiceBus._stopLoop();
      };
      utterance.addEventListener('end', stop);
      utterance.addEventListener('error', stop);
      return stop;
    },
  };
}
