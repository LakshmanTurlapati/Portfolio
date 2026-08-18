import type { SignedToolBatchEnvelopeV1 } from '@full-self-browsing/concierge/ai-sdk';

export const CONCIERGE_AUDIENCE = 'parzival.live/portfolio-concierge-v1';
export const CONCIERGE_KEY_ID = 'parz-portfolio-2026-08';
export const CONCIERGE_SESSION_COOKIE = 'parz_concierge_session';

export function isConciergeSessionId(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{32}$/.test(value);
}

export interface ConciergeBootstrapResponse {
  audience: typeof CONCIERGE_AUDIENCE;
  keyId: typeof CONCIERGE_KEY_ID;
  sessionId: string;
  publicKeyPem: string;
}

interface ConciergeEnvelopeData {
  envelope: SignedToolBatchEnvelopeV1;
}

interface ConciergeRetryData {
  reason: 'catalog-stale';
}

export type ConciergeUIData = {
  'concierge-envelope': ConciergeEnvelopeData;
  'concierge-retry': ConciergeRetryData;
};
