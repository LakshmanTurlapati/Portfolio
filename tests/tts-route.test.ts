import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('TTS route contract', () => {
  it('uses the low-latency ElevenLabs model by default while keeping voice allowlist and validation', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/api/tts/route.ts'), 'utf8');

    expect(source).toContain("const DEFAULT_TTS_MODEL_ID = 'eleven_turbo_v2_5'");
    expect(source).toContain('modelId: DEFAULT_TTS_MODEL_ID');
    expect(source).toContain("const ALLOWED_VOICE_ID = 'dMWVPH9DSxWOMrrrUso3'");
    expect(source).toContain('if (voiceId !== ALLOWED_VOICE_ID) voiceId = ALLOWED_VOICE_ID');
    // Raised from 1000 to 4000 so the proxy can handle a full Grok output
    // (maxOutputTokens=1000 ≈ 4000 chars) without 413'ing and triggering the
    // robotic synth fallback. ElevenLabs eleven_turbo_v2_5 accepts up to ~5000
    // chars per request, so 4000 stays inside the model's per-call limit.
    expect(source).toContain('text must be 4000 characters or fewer');
    expect(source).toContain('text.length > 4000');
    expect(source).not.toContain('eleven_v3');
  });
});
