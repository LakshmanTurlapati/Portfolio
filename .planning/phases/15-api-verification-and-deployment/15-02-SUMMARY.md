---
phase: 15-api-verification-and-deployment
plan: "02"
subsystem: deployment-verification
tags: [production-smoke-test, grok, elevenlabs, fly, dns]
requires:
  - phase: 15-api-verification-and-deployment
    provides: amplify.yml injects ELEVENLABS_API_KEY into .env.production during preBuild
provides:
  - Smoke-test evidence for /api/chat returning streaming AI text
  - Smoke-test evidence for /api/stt-token returning a token without exposing the token value
  - Smoke-test evidence for /api/tts returning audio/mpeg MP3 output
affects: [api-verification, voice-mode-production, deployment]
tech-stack:
  added: []
  patterns:
    - Sanitized production smoke tests that verify token presence without printing token secrets
key-files:
  created: []
  modified: []
key-decisions:
  - "Because audienclature.com returned NXDOMAIN from public DNS, the user approved running smoke tests against https://portfolio-v4-test.fly.dev instead."
patterns-established:
  - "API smoke tests should report status, content type, and sanitized success indicators rather than raw token payloads."
requirements-completed: [API-01, API-02]
duration: "~5min"
completed: 2026-04-25
---

# Phase 15 Plan 02: Deployment Smoke Test Summary

**Chat, STT token, and TTS API routes returned live successful responses on the reachable Fly deployment, with token output sanitized and MP3 output verified.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-25T20:35:00-05:00
- **Completed:** 2026-04-25T20:40:00-05:00
- **Tasks:** 2/2 complete
- **Files modified:** 0

## Accomplishments

- Confirmed the user completed the external deployment checkpoint.
- Detected that `audienclature.com` and `www.audienclature.com` are not currently resolvable from public DNS.
- Ran the three required API smoke tests against the user-approved reachable deployment URL: `https://portfolio-v4-test.fly.dev`.
- Verified `/api/chat` returns HTTP 200 streaming `text/event-stream` data from the AI route.
- Verified `/api/stt-token` returns HTTP 200 JSON with a token field without printing the token value.
- Verified `/api/tts` returns HTTP 200 `audio/mpeg`, saved `/tmp/parz-test.mp3`, and confirmed it is an MP3 file.

## Task Commits

No code commits were required for this human-gated verification plan.

## Files Created/Modified

None.

## Decisions Made

- Used `https://portfolio-v4-test.fly.dev` for smoke tests after the user explicitly chose that substitution because `audienclature.com` DNS was unavailable.
- Sanitized STT token verification output to record only token presence and token length.

## Deviations from Plan

The plan specified smoke testing `https://audienclature.com`. That domain returned `NXDOMAIN` from the local resolver, Cloudflare DNS (`1.1.1.1`), and Google DNS (`8.8.8.8`). The user approved running the same smoke tests against `https://portfolio-v4-test.fly.dev` instead.

Impact: API route behavior is verified on the reachable deployment, but the custom Amplify production domain remains unverified until DNS resolves.

## Issues Encountered

- `audienclature.com` and `www.audienclature.com` could not be resolved by DNS.
- The first smoke test attempt failed before any API request completed with `getaddrinfo ENOTFOUND audienclature.com`.

## Verification Results

1. `curl -I https://audienclature.com` - failed with `Could not resolve host: audienclature.com`.
2. `nslookup audienclature.com 1.1.1.1` - returned `NXDOMAIN`.
3. `nslookup audienclature.com 8.8.8.8` - returned `NXDOMAIN`.
4. `POST https://portfolio-v4-test.fly.dev/api/chat` - HTTP 200, `content-type: text/event-stream`, streaming text chunks returned.
5. `POST https://portfolio-v4-test.fly.dev/api/stt-token` - HTTP 200, `content-type: application/json`, token field present.
6. `POST https://portfolio-v4-test.fly.dev/api/tts` - HTTP 200, `content-type: audio/mpeg`, 20525 bytes written to `/tmp/parz-test.mp3`.
7. `file /tmp/parz-test.mp3` - reported `Audio file with ID3 version 2.4.0, contains: MPEG ADTS, layer III, v1, 128 kbps, 44.1 kHz, Monaural`.

## User Setup Required

DNS for `audienclature.com` still needs to resolve before the original Amplify production-domain verification can be completed.

## Next Phase Readiness

All Phase 15 plans now have execution summaries. Phase-level verification should check whether the Fly URL substitution is acceptable or whether custom-domain DNS is a remaining deployment gap.

---
*Phase: 15-api-verification-and-deployment*
*Completed: 2026-04-25*
