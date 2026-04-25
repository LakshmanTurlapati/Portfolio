// src/app/api/stt-token/route.ts
// Per D-03, D-04: mints a single-use ElevenLabs Scribe token server-side.
// ELEVENLABS_API_KEY stays server-side only — browser receives only the 15-min token.

import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { hasEnvVar } from '@/lib/env';

export async function POST() {
  if (!hasEnvVar('ELEVENLABS_API_KEY')) {
    return Response.json({ error: 'STT not configured' }, { status: 503 });
  }

  try {
    const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });
    const result = await client.tokens.singleUse.create('realtime_scribe');
    return Response.json(result);
  } catch {
    return Response.json({ error: 'Failed to create STT token' }, { status: 500 });
  }
}
