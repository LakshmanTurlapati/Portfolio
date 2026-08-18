import { randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { getConciergeSigningEnv } from '@/lib/env';
import {
  CONCIERGE_AUDIENCE,
  CONCIERGE_KEY_ID,
  CONCIERGE_SESSION_COOKIE,
  isConciergeSessionId,
  type ConciergeBootstrapResponse,
} from '@/lib/concierge-protocol';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function createSessionId(): string {
  return randomBytes(24).toString('base64url');
}

export async function POST(): Promise<Response> {
  let publicKeyPem: string;
  try {
    publicKeyPem = getConciergeSigningEnv().publicKeyPem;
  } catch {
    return Response.json(
      { error: 'Concierge signing is not configured.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const jar = await cookies();
  const existing = jar.get(CONCIERGE_SESSION_COOKIE)?.value;
  const sessionId = isConciergeSessionId(existing) ? existing : createSessionId();
  if (sessionId !== existing) {
    jar.set(CONCIERGE_SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 2 * 60 * 60,
      priority: 'high',
    });
  }

  const body: ConciergeBootstrapResponse = {
    audience: CONCIERGE_AUDIENCE,
    keyId: CONCIERGE_KEY_ID,
    sessionId,
    publicKeyPem,
  };
  return Response.json(body, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
