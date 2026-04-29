import { beforeEach, describe, expect, it } from 'vitest';
import {
  guardApiRequest,
  parseGuardedJson,
  resetApiGuardStateForTests,
  validateChatMessages,
} from '@/lib/api-guard';

const VALID_ORIGIN = 'https://audienclature.com';

function request(
  path = '/api/chat',
  init: RequestInit = {},
  origin = VALID_ORIGIN,
) {
  const { headers, ...rest } = init;
  const mergedHeaders = new Headers(headers);
  mergedHeaders.set('Origin', origin);

  return new Request(`${VALID_ORIGIN}${path}`, {
    ...rest,
    method: 'POST',
    headers: mergedHeaders,
  });
}

describe('paid API guard', () => {
  beforeEach(() => {
    resetApiGuardStateForTests();
    delete process.env.ALLOWED_API_ORIGINS;
  });

  it('allows same-origin and local requests when origin enforcement is active', () => {
    expect(guardApiRequest(request(), { route: 'chat', enforceOrigin: true })).toBeNull();

    const localReq = new Request('http://127.0.0.1:3100/api/chat', {
      method: 'POST',
      headers: { Origin: 'http://127.0.0.1:3100' },
    });
    expect(guardApiRequest(localReq, { route: 'chat', enforceOrigin: true })).toBeNull();

    const flyProxyReq = new Request('http://127.0.0.1:3000/api/chat', {
      method: 'POST',
      headers: {
        Origin: 'https://portfolio-v4-test.fly.dev',
        'x-forwarded-proto': 'https',
        'x-forwarded-host': 'portfolio-v4-test.fly.dev',
      },
    });
    expect(guardApiRequest(flyProxyReq, { route: 'chat', enforceOrigin: true })).toBeNull();

    const forwardedHeaderReq = new Request('http://127.0.0.1:3000/api/chat', {
      method: 'POST',
      headers: {
        Origin: 'https://preview.example.com',
        Forwarded: 'for=203.0.113.10;proto=https;host=preview.example.com',
      },
    });
    expect(guardApiRequest(forwardedHeaderReq, { route: 'chat', enforceOrigin: true })).toBeNull();
  });

  it('blocks cross-origin and missing-origin browser requests when origin enforcement is active', () => {
    const crossOrigin = guardApiRequest(
      request('/api/chat', {}, 'https://bad.example'),
      { route: 'chat', enforceOrigin: true },
    );
    expect(crossOrigin?.status).toBe(403);

    const missingOrigin = guardApiRequest(
      new Request(`${VALID_ORIGIN}/api/chat`, { method: 'POST' }),
      { route: 'chat', enforceOrigin: true },
    );
    expect(missingOrigin?.status).toBe(403);
  });

  it('allows configured preview origins', () => {
    process.env.ALLOWED_API_ORIGINS = 'https://preview.example.com';

    const previewReq = new Request('https://branch.example.amplifyapp.com/api/chat', {
      method: 'POST',
      headers: { Origin: 'https://preview.example.com' },
    });

    expect(guardApiRequest(previewReq, { route: 'chat', enforceOrigin: true })).toBeNull();
  });

  it('applies generous per-route and global limits per IP', () => {
    for (let i = 0; i < 100; i += 1) {
      expect(
        guardApiRequest(request('/api/chat', { headers: { 'x-forwarded-for': '198.51.100.10' } }), {
          route: 'chat',
          enforceOrigin: true,
          now: 0,
        }),
      ).toBeNull();
    }

    const chatLimited = guardApiRequest(
      request('/api/chat', { headers: { 'x-forwarded-for': '198.51.100.10' } }),
      { route: 'chat', enforceOrigin: true, now: 0 },
    );
    expect(chatLimited?.status).toBe(429);
    expect(chatLimited?.headers.get('Retry-After')).toBe('600');

    resetApiGuardStateForTests();

    for (let i = 0; i < 100; i += 1) {
      expect(guardApiRequest(request('/api/chat'), { route: 'chat', enforceOrigin: true, now: 0 })).toBeNull();
    }
    for (let i = 0; i < 150; i += 1) {
      expect(guardApiRequest(request('/api/tts'), { route: 'tts', enforceOrigin: true, now: 0 })).toBeNull();
    }
    for (let i = 0; i < 50; i += 1) {
      expect(
        guardApiRequest(request('/api/stt-token'), { route: 'stt-token', enforceOrigin: true, now: 0 }),
      ).toBeNull();
    }

    const globallyLimited = guardApiRequest(
      request('/api/stt-token'),
      { route: 'stt-token', enforceOrigin: true, now: 0 },
    );
    expect(globallyLimited?.status).toBe(429);
  });

  it('rejects non-json and oversized JSON requests', async () => {
    const nonJson = await parseGuardedJson(request('/api/tts', {
      headers: { 'content-type': 'text/plain' },
      body: 'hello',
    }), {
      route: 'tts',
      maxBodyBytes: 16 * 1024,
      enforceOrigin: true,
    });
    expect(nonJson.ok).toBe(false);
    if (!nonJson.ok) expect(nonJson.response.status).toBe(415);

    const oversized = await parseGuardedJson(request('/api/tts', {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'hello' }),
    }), {
      route: 'tts',
      maxBodyBytes: 5,
      enforceOrigin: true,
    });
    expect(oversized.ok).toBe(false);
    if (!oversized.ok) expect(oversized.response.status).toBe(413);
  });

  it('rejects excessive chat messages and aggregate text', () => {
    const tooMany = validateChatMessages(
      Array.from({ length: 41 }, () => ({
        role: 'user',
        parts: [{ type: 'text', text: 'hello' }],
      })),
    );
    expect(tooMany?.status).toBe(413);

    const tooLarge = validateChatMessages([
      {
        role: 'user',
        parts: [{ type: 'text', text: 'a'.repeat(12_001) }],
      },
    ]);
    expect(tooLarge?.status).toBe(413);
  });
});
