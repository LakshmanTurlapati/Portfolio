// PCM AudioWorklet for Grok Voice uplink.
// Posts a copy of each mono Float32 render quantum. The main thread resamples
// to 24 kHz PCM16 before input_audio_buffer.append.
class PCMProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];
    if (input && input[0]) {
      const float32 = input[0];
      this.port.postMessage(float32.slice().buffer);
    }
    return true;
  }
}
registerProcessor('pcm-processor', PCMProcessor);
