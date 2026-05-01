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
    expect(source).toContain('text must be 1000 characters or fewer');
    expect(source).not.toContain('eleven_v3');
  });
});
