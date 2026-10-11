// Mints a short-lived Grok Voice client secret. XAI_API_KEY stays on the server.
// The browser connects to wss://api.x.ai/v1/realtime with the secret, never the API key.

import { hasEnvVar } from '@/lib/env';
import { guardApiRequest } from '@/lib/api-guard';
import { buildGrokVoiceInstructions } from '@/lib/grok-voice-instructions';
import { DEFAULT_GROK_VOICE_ID, GROK_VOICE_MODEL } from '@/lib/grok-voice-tools';

const CLIENT_SECRET_URL = 'https://api.x.ai/v1/realtime/client_secrets';
const SECRET_TTL_SECONDS = 300;

function lockedVoiceId(): string {
  const configured = process.env.GROK_VOICE_ID?.trim();
  if (configured && /^[a-z0-9]+$/.test(configured)) return configured;
  return DEFAULT_GROK_VOICE_ID;
}

export async function POST(req: Request) {
  if (!hasEnvVar('XAI_API_KEY')) {
    return Response.json({ error: 'Voice not configured' }, { status: 503 });
  }

  const guardResponse = guardApiRequest(req, { route: 'voice-session' });
  if (guardResponse) return guardResponse;

  try {
    const upstream = await fetch(CLIENT_SECRET_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.XAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ expires_after: { seconds: SECRET_TTL_SECONDS } }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!upstream.ok) {
      return Response.json({ error: 'Failed to start voice session' }, { status: 502 });
    }

    const payload = await upstream.json() as { value?: unknown };
    const token = typeof payload.value === 'string' ? payload.value : '';
    if (!token) {
      return Response.json({ error: 'Failed to start voice session' }, { status: 502 });
    }

    return Response.json({
      token,
      voice: lockedVoiceId(),
      model: GROK_VOICE_MODEL,
      instructions: buildGrokVoiceInstructions(),
    });
  } catch {
    return Response.json({ error: 'Failed to start voice session' }, { status: 502 });
  }
}
