type PaidApiRoute = 'chat' | 'tts' | 'stt-token';

type RateLimitRule = {
  limit: number;
  windowMs: number;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type GuardOptions = {
  route: PaidApiRoute;
  enforceOrigin?: boolean;
  now?: number;
};

type JsonGuardOptions = GuardOptions & {
  maxBodyBytes: number;
};

type GuardedJson<T> =
  | { ok: true; body: T }
  | { ok: false; response: Response };

const TEN_MINUTES = 10 * 60 * 1000;
const FIFTEEN_MINUTES = 15 * 60 * 1000;

const GLOBAL_LIMIT: RateLimitRule = { limit: 300, windowMs: FIFTEEN_MINUTES };

const ROUTE_LIMITS: Record<PaidApiRoute, RateLimitRule> = {
  chat: { limit: 100, windowMs: TEN_MINUTES },
  tts: { limit: 150, windowMs: TEN_MINUTES },
  'stt-token': { limit: 80, windowMs: TEN_MINUTES },
};

const DEFAULT_ALLOWED_ORIGINS = ['https://parzival.live'];

declare global {
  var __portfolioApiRateLimits: Map<string, RateLimitEntry> | undefined;
}

function rateLimitStore(): Map<string, RateLimitEntry> {
  globalThis.__portfolioApiRateLimits ??= new Map<string, RateLimitEntry>();
  return globalThis.__portfolioApiRateLimits;
}

export function resetApiGuardStateForTests() {
  globalThis.__portfolioApiRateLimits = new Map<string, RateLimitEntry>();
}

export function guardApiRequest(req: Request, options: GuardOptions): Response | null {
  const originResponse = guardOrigin(req, options.enforceOrigin);
  if (originResponse) return originResponse;

  const now = options.now ?? Date.now();
  const clientIp = getClientIp(req);
  const globalResult = consumeRateLimit(`global:${clientIp}`, GLOBAL_LIMIT, now);
  if (!globalResult.ok) return rateLimitResponse(globalResult.retryAfter);

  const routeResult = consumeRateLimit(
    `${options.route}:${clientIp}`,
    ROUTE_LIMITS[options.route],
    now,
  );
  if (!routeResult.ok) return rateLimitResponse(routeResult.retryAfter);

  return null;
}

export async function parseGuardedJson<T>(
  req: Request,
  options: JsonGuardOptions,
): Promise<GuardedJson<T>> {
  const guardResponse = guardApiRequest(req, options);
  if (guardResponse) return { ok: false, response: guardResponse };

  const contentType = req.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return {
      ok: false,
      response: jsonError('Request must use application/json.', 415),
    };
  }

  const contentLength = Number(req.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > options.maxBodyBytes) {
    return {
      ok: false,
      response: jsonError('Request body is too large.', 413),
    };
  }

  let raw = '';
  try {
    raw = await req.text();
  } catch {
    return {
      ok: false,
      response: jsonError('Could not read request body.', 400),
    };
  }

  if (new TextEncoder().encode(raw).byteLength > options.maxBodyBytes) {
    return {
      ok: false,
      response: jsonError('Request body is too large.', 413),
    };
  }

  try {
    return { ok: true, body: JSON.parse(raw) as T };
  } catch {
    return {
      ok: false,
      response: jsonError('Invalid JSON request body.', 400),
    };
  }
}

export function validateChatMessages(messages: unknown): Response | null {
  if (!Array.isArray(messages)) {
    return jsonError('messages must be an array.', 400);
  }

  if (messages.length > 40) {
    return jsonError('Too many messages.', 413);
  }

  const aggregateTextChars = messages.reduce((sum, message) => {
    return sum + extractMessageText(message).length;
  }, 0);

  if (aggregateTextChars > 12_000) {
    return jsonError('Message content is too large.', 413);
  }

  return null;
}

export function jsonError(message: string, status: number, headers?: HeadersInit): Response {
  return Response.json(
    { error: message },
    {
      status,
      headers,
    },
  );
}

function guardOrigin(req: Request, enforceOrigin = process.env.NODE_ENV === 'production'): Response | null {
  if (!enforceOrigin) return null;

  const requestOrigins = requestCandidateOrigins(req);
  const sourceOrigin = requestSourceOrigin(req);

  if (!sourceOrigin) {
    return jsonError('Request origin is required.', 403);
  }

  if (requestOrigins.has(sourceOrigin)) {
    return null;
  }

  if (allowedOrigins().has(sourceOrigin) || isLocalOrigin(sourceOrigin)) {
    return null;
  }

  return jsonError('Request origin is not allowed.', 403);
}

function requestCandidateOrigins(req: Request): Set<string> {
  const origins = new Set<string>();
  const requestOrigin = safeOrigin(req.url);
  if (requestOrigin) origins.add(requestOrigin);

  const forwarded = parseForwardedHeader(req.headers.get('forwarded'));
  const forwardedHost =
    forwarded.host ??
    firstHeaderValue(req.headers.get('x-forwarded-host')) ??
    firstHeaderValue(req.headers.get('host'));
  const forwardedProto =
    forwarded.proto ??
    firstHeaderValue(req.headers.get('x-forwarded-proto')) ??
    safeProtocol(req.url);

  const forwardedOrigin = originFromProtocolAndHost(forwardedProto, forwardedHost);
  if (forwardedOrigin) origins.add(forwardedOrigin);

  return origins;
}

function requestSourceOrigin(req: Request): string | null {
  const origin = req.headers.get('origin');
  if (origin) return safeOrigin(origin);

  const referer = req.headers.get('referer');
  if (referer) return safeOrigin(referer);

  return null;
}

function parseForwardedHeader(header: string | null): { host?: string; proto?: string } {
  const first = firstHeaderValue(header);
  if (!first) return {};

  const result: { host?: string; proto?: string } = {};
  for (const part of first.split(';')) {
    const [rawKey, rawValue] = part.split('=');
    const key = rawKey?.trim().toLowerCase();
    const value = rawValue?.trim().replace(/^"|"$/g, '');
    if (key === 'host' && value) result.host = value;
    if (key === 'proto' && value) result.proto = value;
  }
  return result;
}

function firstHeaderValue(value: string | null): string | null {
  const first = value?.split(',')[0]?.trim();
  return first || null;
}

function safeProtocol(input: string): string | null {
  try {
    const protocol = new URL(input).protocol.replace(':', '');
    return protocol || null;
  } catch {
    return null;
  }
}

function originFromProtocolAndHost(protocol: string | null | undefined, host: string | null | undefined): string | null {
  if (!protocol || !host) return null;
  const normalizedProtocol = protocol.toLowerCase();
  if (normalizedProtocol !== 'http' && normalizedProtocol !== 'https') return null;
  return safeOrigin(`${normalizedProtocol}://${host}`);
}

function allowedOrigins(): Set<string> {
  const configured = (process.env.ALLOWED_API_ORIGINS ?? '')
    .split(',')
    .map((origin) => safeOrigin(origin.trim()))
    .filter((origin): origin is string => Boolean(origin));

  return new Set([...DEFAULT_ALLOWED_ORIGINS, ...configured]);
}

function safeOrigin(input: string): string | null {
  try {
    return new URL(input).origin;
  } catch {
    return null;
  }
}

function isLocalOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    return (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    );
  } catch {
    return false;
  }
}

function consumeRateLimit(
  key: string,
  rule: RateLimitRule,
  now: number,
): { ok: true } | { ok: false; retryAfter: number } {
  const store = rateLimitStore();
  pruneExpiredEntries(store, now);

  const current = store.get(key);
  if (!current || current.resetAt <= now) {
    store.set(key, {
      count: 1,
      resetAt: now + rule.windowMs,
    });
    return { ok: true };
  }

  if (current.count >= rule.limit) {
    return {
      ok: false,
      retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  return { ok: true };
}

function pruneExpiredEntries(store: Map<string, RateLimitEntry>, now: number) {
  if (store.size < 10_000) return;

  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}

function rateLimitResponse(retryAfter: number): Response {
  return jsonError('Too many requests. Please try again shortly.', 429, {
    'Retry-After': String(retryAfter),
  });
}

function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const firstIp = forwarded.split(',')[0]?.trim();
    if (firstIp) return firstIp;
  }

  return (
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('true-client-ip') ||
    req.headers.get('fly-client-ip') ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

function extractMessageText(message: unknown): string {
  if (!message || typeof message !== 'object') return '';

  const record = message as Record<string, unknown>;
  if (Array.isArray(record.parts)) {
    return record.parts
      .map((part) => {
        if (!part || typeof part !== 'object') return '';
        const text = (part as Record<string, unknown>).text;
        return typeof text === 'string' ? text : '';
      })
      .join('');
  }

  return typeof record.content === 'string' ? record.content : '';
}
