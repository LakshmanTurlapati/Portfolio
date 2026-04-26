---
phase: 20
plan: 01
subsystem: verification
tags: [vitest, playwright, parz, regression]
key-files:
  - package.json
  - vitest.config.ts
  - playwright.config.ts
  - src/lib/site-control-utils.ts
  - src/providers/site-control-provider.tsx
  - tests/parz-contracts.test.ts
  - tests/project-resolution.test.ts
  - e2e/parz-site-control.spec.ts
metrics:
  vitest_tests: 12
  playwright_tests: 1
---

# Plan 20-01 Summary: Verification Harness and Contract Tests

## What Changed

- Added Vitest scripts/config and deterministic tests for Parz persona contracts, guardrail coverage, source parity, and project resolver safety.
- Added Playwright config and a focused E2E spec that verifies Parz shell control can navigate, scroll, open GitFly in the inbuilt browser, and show the FSB overlay/badge.
- Added a small pure `src/lib/site-control-utils.ts` helper for section normalization so unit tests do not import the full client provider.
- Added a non-production `window.__parzSiteControl` hook in `SiteControlProvider` for E2E control actions without live Grok/API calls.
- Ignored Playwright output directories.

## Verification

| Command | Result |
|---------|--------|
| `npm test` | Passed: 2 files, 12 tests |
| `npm run lint` | Passed with 7 pre-existing warnings outside the new changes |
| `npm run test:e2e` | Passed: 1 Chromium test |

## Deviations

- `npm install` required `--legacy-peer-deps` because the existing `@ai-sdk/react` peer range conflicts with the pinned React 19.1.0 version. No runtime package versions were changed intentionally.
- Playwright uses port `3100` instead of `3000` to avoid reusing an unrelated local dev server.

## Self-Check

PASSED. EVAL-01 through EVAL-04 have deterministic Vitest coverage, and EVAL-05 has focused Playwright coverage that runs locally without API keys.
