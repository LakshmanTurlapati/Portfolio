---
phase: 15-api-verification-and-deployment
plan: "03"
subsystem: deployment-verification
tags: [amplify, smoke-test, deferred, dns, api-routes]
requires:
  - phase: 15-api-verification-and-deployment
    provides: Phase 15 verification report identifying Amplify/custom-domain smoke test gap
provides:
  - Repeatable sanitized Amplify API smoke test runner
  - Explicit deferral of live Amplify/custom-domain route testing to future requirement API-03
affects: [deployment, api-verification, future-milestone]
tech-stack:
  added: []
  patterns:
    - Node ESM production smoke test runner with DNS preflight and sanitized output
key-files:
  created:
    - scripts/verify-amplify-apis.mjs
  modified: []
key-decisions:
  - "Live Amplify/custom-domain smoke testing is deferred from v4.0 because no reachable Amplify production URL is available."
  - "The verifier script rejects the Fly substitute so future API-03 evidence must come from Amplify/custom-domain production."
patterns-established:
  - "Deployment verification scripts must not print API keys, STT token values, full AI streams, or audio bytes."
requirements-completed: [API-01, API-02]
deferred-requirements: [API-03]
duration: "~10min"
completed: 2026-04-26
---

# Phase 15 Plan 03: Amplify Verifier and Deployment Deferral Summary

**A sanitized Amplify API verifier is now available, and the live Amplify/custom-domain smoke test is explicitly deferred to future requirement API-03.**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-04-26T01:45:00Z
- **Completed:** 2026-04-26T01:55:27Z
- **Tasks:** 1 completed, 1 deferred by scope decision
- **Files modified:** 1 created

## Accomplishments

- Created `scripts/verify-amplify-apis.mjs`, a Node 20+ ESM smoke-test runner for future Amplify production verification.
- Script requires `PRODUCTION_BASE_URL`, normalizes the base URL, resolves DNS before route tests, and rejects `https://portfolio-v4-test.fly.dev`.
- Script tests text chat, voice-style chat, STT token, and TTS MP3 routes with bounded benign payloads.
- Script prints sanitized success markers only: `chat_text_stream`, `chat_voice_stream`, `stt_token_present`, and `tts_mp3_signature`.
- User clarified that deployment verification should be deferred from the current milestone, so no live Amplify URL was required for v4.0 completion.

## Task Commits

1. **Task 1: Create sanitized Amplify API smoke test script** - `5bff847` (test)
2. **Task 2: Restore or identify reachable Amplify production endpoint and run smoke tests** - deferred to future requirement API-03

## Files Created/Modified

- `scripts/verify-amplify-apis.mjs` - Repeatable sanitized verifier for `/api/chat`, `/api/stt-token`, and `/api/tts` against a future Amplify production URL.

## Decisions Made

- Deferred live Amplify/custom-domain smoke testing from v4.0 because `audienclature.com` is currently DNS `NXDOMAIN` and no alternate Amplify URL is available.
- Kept the verifier script in the repo so future API-03 can complete without replanning the test mechanics.

## Deviations from Plan

The original gap-closure plan required a reachable Amplify production URL and a successful smoke-test run before creating this summary. The user changed scope: deployment verification is deferred out of the current milestone. This summary therefore records the completed verifier script and the explicit deferral instead of claiming production route evidence.

## Issues Encountered

- `audienclature.com` and `www.audienclature.com` were previously confirmed as DNS `NXDOMAIN` from local, Cloudflare, and Google DNS resolvers.
- No reachable Amplify production URL was available during this milestone.

## Verification Results

1. `node --check scripts/verify-amplify-apis.mjs` - exits 0.
2. `PRODUCTION_BASE_URL="https://portfolio-v4-test.fly.dev" node scripts/verify-amplify-apis.mjs` - exits nonzero and prints `Fly substitute is not valid for Phase 15 gap closure; use the Amplify production URL`.
3. Script contains all required route strings: `/api/chat`, `/api/stt-token`, `/api/tts`.
4. Script contains the required voice ID: `dMWVPH9DSxWOMrrrUso3`.
5. Script does not log API keys, raw STT token values, full streamed AI output, or MP3 bytes.

## User Setup Required

Future API-03 requires a reachable Amplify production URL, either restored `https://audienclature.com`, `https://www.audienclature.com`, or the app's `https://main.<amplify-app-id>.amplifyapp.com` URL. Once available, run:

```bash
PRODUCTION_BASE_URL="<AMPLIFY_PRODUCTION_URL>" node scripts/verify-amplify-apis.mjs
```

## Next Phase Readiness

v4.0 can complete without live Amplify/custom-domain smoke testing. The deferred deployment verification is tracked as future requirement API-03 and has an executable verifier ready.

---
*Phase: 15-api-verification-and-deployment*
*Completed: 2026-04-26*
