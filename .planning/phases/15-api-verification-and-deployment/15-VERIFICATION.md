---
phase: 15-api-verification-and-deployment
verified: 2026-04-26T01:44:13Z
status: passed
score: 5/5 scoped must-haves verified
deferred:
  - truth: "Run live /api/chat, /api/stt-token, and /api/tts smoke tests against Amplify/custom-domain production"
    reason: "User deferred deployment verification out of v4.0 because audienclature.com is DNS NXDOMAIN and no reachable Amplify production URL is available."
    future_requirement: API-03
    verifier: scripts/verify-amplify-apis.mjs
---

# Phase 15: API Verification and Deployment Verification Report

**Phase Goal:** Voice and chat API routes are deployment-ready -- server-side key injection is configured, reachable deployment smoke tests pass, and a repeatable Amplify verifier exists for the deferred custom-domain production check
**Verified:** 2026-04-26T01:44:13Z
**Status:** passed after scope deferral
**Re-verification:** Scope updated on 2026-04-26 after user deferred live Amplify/custom-domain smoke testing out of v4.0

## Goal Achievement

The implementation, key injection, reachable deployment smoke tests, and repeatable verifier script are complete. The original Amplify/custom-domain live smoke test could not run because `audienclature.com`/`www.audienclature.com` are DNS `NXDOMAIN`; the user explicitly deferred that deployment verification out of v4.0. The deferred work is tracked as future requirement API-03 and can be completed with `scripts/verify-amplify-apis.mjs` once an Amplify production URL is reachable.

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `amplify.yml` preBuild injects both `XAI_API_KEY` and `ELEVENLABS_API_KEY` into `.env.production` | ✓ VERIFIED | `amplify.yml` lines 10-11 echo both keys during preBuild. |
| 2 | API route implementations are real provider calls, not stubs | ✓ VERIFIED | `/api/chat` uses `streamText` with `xai('grok-4-1-fast-non-reasoning')`; `/api/stt-token` calls `client.tokens.singleUse.create('realtime_scribe')`; `/api/tts` calls `client.textToSpeech.stream(...)`. |
| 3 | Voice and text clients are wired to server API routes | ✓ VERIFIED | `voice-controller.ts` fetches `/api/chat`, `/api/stt-token`, and `/api/tts`; chat page and popup use `useChat`, which targets the app chat API. |
| 4 | Reachable deployment smoke tests prove `/api/chat`, `/api/stt-token`, and `/api/tts` execute real provider calls | ✓ VERIFIED | Fly deployment returned HTTP 200 `text/event-stream` for chat, HTTP 200 token JSON for STT, and HTTP 200 `audio/mpeg` valid MP3 for TTS. |
| 5 | A repeatable verifier exists for future Amplify/custom-domain production checks and rejects the Fly substitute | ✓ VERIFIED | `scripts/verify-amplify-apis.mjs` requires `PRODUCTION_BASE_URL`, rejects `portfolio-v4-test.fly.dev`, resolves DNS first, and checks text chat, voice-style chat, STT token, and TTS MP3 output. |
| D1 | Live Amplify/custom-domain production route smoke test | DEFERRED | Deferred to future requirement API-03 because no reachable Amplify/custom-domain URL is currently available. |

**Score:** 5/5 scoped truths verified; 1 deployment verification item deferred

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `amplify.yml` | Build spec injects both API keys at build time | ✓ VERIFIED | gsd artifact verification passed for both plans; file contains `XAI_API_KEY` and `ELEVENLABS_API_KEY` preBuild echo lines. |
| `src/app/api/chat/route.ts` | Real xAI Grok streaming route | ✓ VERIFIED | Env-gated route streams `xai('grok-4-1-fast-non-reasoning')` via AI SDK. |
| `src/app/api/stt-token/route.ts` | Real ElevenLabs STT token route | ✓ VERIFIED | Env-gated route creates a single-use `realtime_scribe` token. |
| `src/app/api/tts/route.ts` | Real ElevenLabs TTS route | ✓ VERIFIED | Env-gated route streams `audio/mpeg` using allowed voice ID and `eleven_turbo_v2_5`. |
| `scripts/verify-amplify-apis.mjs` | Future Amplify/custom-domain smoke test runner | ✓ VERIFIED | Syntax-valid script committed in Plan 15-03; rejects Fly substitute and sanitizes token/audio output. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `amplify.yml` preBuild | `.env.production` | `echo "ELEVENLABS_API_KEY=$ELEVENLABS_API_KEY" >> .env.production` | ✓ VERIFIED | Manual inspection confirms the exact link; gsd key-link helper could not infer non-file source names and reported `Source file not found`. |
| Client voice controller | `/api/chat` | `fetch('/api/chat', { isVoice: true })` | ✓ VERIFIED | Voice queries are sent through the same server route with voice tools enabled. |
| Client voice controller | `/api/stt-token` | `fetch('/api/stt-token', { method: 'POST' })` | ✓ VERIFIED | Browser receives a token from the server route, not the API key. |
| Client voice controller | `/api/tts` | `fetch('/api/tts', ...)` | ✓ VERIFIED | TTS response is decoded as audio and played through `AudioContext`. |
| Amplify production DNS/custom domain | API routes | `https://audienclature.com/api/...` | DEFERRED | DNS lookup for `audienclature.com` failed with `ENOTFOUND`; future API-03 will run the verifier once DNS or an Amplify URL is available. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `/api/chat` | streamed AI response | xAI via AI SDK `streamText` | Yes when env configured; Fly smoke test returned stream bytes | ✓ FLOWING on reachable deployment; Amplify live check deferred |
| `/api/stt-token` | `token` | ElevenLabs `tokens.singleUse.create` | Yes on Fly smoke test | ✓ FLOWING on reachable deployment; Amplify live check deferred |
| `/api/tts` | MP3 audio stream | ElevenLabs `textToSpeech.stream` | Yes on Fly smoke test | ✓ FLOWING on reachable deployment; Amplify live check deferred |
| `scripts/verify-amplify-apis.mjs` | sanitized verification output | `PRODUCTION_BASE_URL` + production route fetches | Yes when an Amplify URL is supplied | ✓ READY for future API-03 |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Production custom domain resolves | `node dns.resolve4('audienclature.com')` | `ENOTFOUND` | ✗ FAIL |
| Substitute Fly `/api/chat` streams | sanitized Node `fetch` POST to `https://portfolio-v4-test.fly.dev/api/chat` | HTTP 200 `text/event-stream`, first chunk 24 bytes | ✓ PASS (substitute only) |
| Substitute Fly `/api/stt-token` returns token | sanitized Node `fetch` POST, token value not printed | HTTP 200 `application/json`, `token_present true` | ✓ PASS (substitute only) |
| Substitute Fly `/api/tts` returns MP3 | sanitized Node `fetch` POST | HTTP 200 `audio/mpeg`, 16345 bytes, MP3 signature true | ✓ PASS (substitute only) |
| Amplify verifier script syntax | `node --check scripts/verify-amplify-apis.mjs` | exits 0 | ✓ PASS |
| Amplify verifier rejects Fly | `PRODUCTION_BASE_URL="https://portfolio-v4-test.fly.dev" node scripts/verify-amplify-apis.mjs` | exits nonzero with explicit rejection message | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| API-01 | 15-01, 15-02, 15-03 | Voice mode and text chat both reach xAI Grok via `/api/chat` and return real AI responses on the reachable deployed environment; Amplify-specific smoke test deferred | ✓ COMPLETE | Code wiring is real, reachable deployment `/api/chat` passed, and future Amplify verification is scripted. |
| API-02 | 15-01, 15-02, 15-03 | ElevenLabs TTS and STT keys are verified working on the reachable deployed environment, and Amplify build-time key injection is configured; live Amplify/custom-domain smoke testing is deferred | ✓ COMPLETE | Reachable deployment STT/TTS passed, `amplify.yml` injection is present, and future Amplify verification is scripted. |
| API-03 | Future | Restore or identify a reachable Amplify production URL and run `scripts/verify-amplify-apis.mjs` | DEFERRED | User explicitly deferred deployment verification out of v4.0. |

No orphaned Phase 15 requirements found: `.planning/REQUIREMENTS.md` maps API-01 and API-02 to Phase 15. API-03 is intentionally future/deferred.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | — | — | No stub/placeholder anti-patterns found in the phase artifact or API route implementations. |

### Human Verification Required

The following follow-up is deferred after DNS/Amplify access is restored:

### 1. Amplify production route smoke test

**Test:** Run the same `/api/chat`, `/api/stt-token`, and `/api/tts` smoke tests against the actual Amplify production URL or restored `https://audienclature.com` domain.
**Expected:** `/api/chat` returns HTTP 200 streaming text; `/api/stt-token` returns HTTP 200 JSON with token present; `/api/tts` returns HTTP 200 `audio/mpeg` valid MP3. No route returns 503.
**Why human:** Requires a reachable Amplify production deployment/custom domain and potentially AWS Console/build-log access.

### Deferred Work Summary

The code-level fix, reachable deployment smoke tests, and verifier tooling are complete. The only remaining work is future deployment/DNS verification: run `PRODUCTION_BASE_URL="<AMPLIFY_URL>" node scripts/verify-amplify-apis.mjs` once `audienclature.com` or the actual Amplify URL is publicly reachable.

---

_Verified: 2026-04-26T01:44:13Z_
_Verifier: the agent (gsd-verifier)_
