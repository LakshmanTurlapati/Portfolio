import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { downsampleFloat32, parseToolArguments } from '@/lib/grok-voice-session';
import { DEFAULT_GROK_VOICE_ID } from '@/lib/grok-voice-tools';

describe('Grok Voice session contract', () => {
  it('locks the custom voice and mints a server-side client secret', () => {
    const route = readFileSync(join(process.cwd(), 'src/app/api/voice-session/route.ts'), 'utf8');
    const tools = readFileSync(join(process.cwd(), 'src/lib/grok-voice-tools.ts'), 'utf8');

    expect(tools).toContain(`export const DEFAULT_GROK_VOICE_ID = '${DEFAULT_GROK_VOICE_ID}'`);
    expect(route).toContain('https://api.x.ai/v1/realtime/client_secrets');
    expect(route).toContain('process.env.XAI_API_KEY');
    expect(route).toContain('lockedVoiceId');
    expect(route).not.toContain('ELEVENLABS');
    expect(route).toContain('buildGrokVoiceInstructions');
  });

  it('downsamples microphone audio toward 24 kHz and parses tool arguments', () => {
    const samples = new Float32Array([0, 0.5, 1, -1]);
    expect(downsampleFloat32(samples, 48000, 24000)).toHaveLength(2);
    expect(parseToolArguments('{"page":"about"}')).toEqual({ page: 'about' });
    expect(parseToolArguments({ name: 'FSB' })).toEqual({ name: 'FSB' });
  });
});
