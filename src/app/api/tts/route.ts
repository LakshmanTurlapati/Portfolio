// src/app/api/tts/route.ts
// Per D-01, D-02, D-03, D-04: ElevenLabs streaming TTS proxy.
// ELEVENLABS_API_KEY is server-side only — never exposed to client bundle.

import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { hasEnvVar } from '@/lib/env';
import { jsonError, parseGuardedJson } from '@/lib/api-guard';

const ALLOWED_VOICE_ID = 'dMWVPH9DSxWOMrrrUso3'; // per D-02, locked
const DEFAULT_TTS_MODEL_ID = 'eleven_turbo_v2_5';

export async function POST(req: Request) {
  if (!hasEnvVar('ELEVENLABS_API_KEY')) {
    return new Response(
      JSON.stringify({ error: 'TTS not configured' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let text: string;
  let voiceId: string;
  try {
    const guarded = await parseGuardedJson<{ text?: unknown; voiceId?: unknown }>(req, {
      route: 'tts',
      maxBodyBytes: 16 * 1024,
    });
    if (!guarded.ok) return guarded.response;

    const body = guarded.body;
    text = typeof body.text === 'string' ? body.text.trim() : '';
    voiceId = typeof body.voiceId === 'string' ? body.voiceId : ALLOWED_VOICE_ID;
    // Security: allowlist voice ID per D-02 threat mitigation
    if (voiceId !== ALLOWED_VOICE_ID) voiceId = ALLOWED_VOICE_ID;
    if (!text) {
      return new Response(
        JSON.stringify({ error: 'text is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    if (text.length > 1000) {
      return jsonError('text must be 1000 characters or fewer', 413);
    }
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid request body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });
    // stream() returns ReadableStream<Uint8Array> — pass directly to Response for streaming
    const audioStream = await client.textToSpeech.stream(voiceId, {
      text,
      modelId: DEFAULT_TTS_MODEL_ID,
      outputFormat: 'mp3_44100_128',
    });

    return new Response(audioStream as ReadableStream, {
      headers: { 'Content-Type': 'audio/mpeg' },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: 'TTS failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
