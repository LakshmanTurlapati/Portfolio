// src/app/api/stt-token/route.ts
// Per D-03, D-04: mints a single-use ElevenLabs Scribe token server-side.
// ELEVENLABS_API_KEY stays server-side only — browser receives only the 15-min token.

import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { hasEnvVar } from '@/lib/env';

export async function POST() {
  const t0 = Date.now();
  if (!hasEnvVar('ELEVENLABS_API_KEY')) {
    console.warn('[stt-token] 503 — ELEVENLABS_API_KEY missing');
    return Response.json({ error: 'STT not configured' }, { status: 503 });
  }

  try {
    const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });
    const result = await client.tokens.singleUse.create('realtime_scribe');
    console.warn(`[stt-token] ok ${Date.now() - t0}ms`);
    return Response.json(result);
  } catch (err) {
    console.warn(`[stt-token] error after ${Date.now() - t0}ms:`, err instanceof Error ? err.message : err);
    return Response.json({ error: 'Failed to create STT token' }, { status: 500 });
  }
}
