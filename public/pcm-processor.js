// public/pcm-processor.js
// PCM16 AudioWorklet processor for ElevenLabs Scribe v2 realtime STT.
// Plain JS only — no imports, no ESM. AudioWorklet runs in isolated audio thread scope.
// Loaded via: sttCtx.audioWorklet.addModule('/pcm-processor.js')
class PCMProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];
    if (input && input[0]) {
      const float32 = input[0];
      const int16 = new Int16Array(float32.length);
      for (let i = 0; i < float32.length; i++) {
        const s = Math.max(-1, Math.min(1, float32[i]));
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      // Transfer buffer ownership to main thread (zero-copy via Transferable)
      this.port.postMessage(int16.buffer, [int16.buffer]);
    }
    return true; // must return true to keep processor alive; false auto-terminates
  }
}
registerProcessor('pcm-processor', PCMProcessor);
