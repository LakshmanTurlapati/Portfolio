---
phase: 04-page-transitions-and-deployment
plan: "02"
subsystem: infra
tags: [aws-amplify, deployment, next.js, environment-variables, metadata]

# Dependency graph
requires:
  - phase: 01-app-shell-and-navigation
    provides: Next.js project structure and layout
  - phase: 03-content-pages-and-chat
    provides: Chat API route requiring XAI_API_KEY
provides:
  - amplify.yml build specification for AWS Amplify deployment
  - Environment variable injection for server-side API keys
  - Production metadata (Open Graph, Apple Web App, Twitter cards)
  - Environment validation utility for API routes
  - .env.example for developer onboarding
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: [amplify.yml env injection, server-side env validation]

key-files:
  created:
    - amplify.yml
    - .env.example
    - src/lib/env.ts
  modified:
    - next.config.ts
    - src/app/layout.tsx
    - src/app/api/chat/route.ts

key-decisions:
  - "Amplify env var injection via echo to .env.production in preBuild phase"
  - "Added env validation guard in chat API route returning 503 when XAI_API_KEY missing"
  - "Production metadata matching Flutter version title and description"

patterns-established:
  - "Environment validation: use hasEnvVar() for conditional checks, getServerEnv() for required validation"
  - "Amplify deployment: env vars must be written to .env.production at build time for Lambda runtime access"

requirements-completed: [DEPLOY-01, DEPLOY-02, DEPLOY-03]

# Metrics
duration: 3min
completed: 2026-04-03
---

# Phase 4 Plan 2: AWS Amplify Deployment Configuration Summary

**Amplify build spec with env var injection for XAI_API_KEY, production metadata, and runtime env validation**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-03T20:46:51Z
- **Completed:** 2026-04-03T20:49:22Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Created amplify.yml with proper build phases and environment variable injection for server-side API keys
- Configured next.config.ts with production settings (strict mode, image optimization, security headers)
- Updated layout.tsx with production metadata matching the Flutter version (title, OG tags, Apple Web App)
- Added environment validation utility and graceful 503 response when XAI_API_KEY is missing
- Created .env.example for developer onboarding documentation

## Task Commits

Each task was committed atomically:

1. **Task 1: Create amplify.yml and production next.config.ts** - `7d7c936` (feat)
2. **Task 2: Add production metadata, env validation, and .env.example** - `89894b7` (feat)

**Plan file:** `7fad2b1` (docs: add AWS Amplify deployment plan)

## Files Created/Modified
- `amplify.yml` - AWS Amplify build specification with preBuild env injection
- `.env.example` - Documents required environment variables for developers
- `src/lib/env.ts` - Server-side environment validation utilities (getServerEnv, hasEnvVar)
- `next.config.ts` - Production config with reactStrictMode, image optimization, security headers
- `src/app/layout.tsx` - Production metadata (title, description, OG, Twitter, Apple Web App, icons)
- `src/app/api/chat/route.ts` - Added env var check returning 503 when XAI_API_KEY is unconfigured

## Decisions Made
- Used `echo` to `.env.production` approach in amplify.yml for env var injection (per research findings, Amplify Console env vars are not available to Lambda runtime without this)
- Added X-Frame-Options DENY, X-Content-Type-Options nosniff, and Referrer-Policy headers for production security
- Chat API returns 503 Service Unavailable (not 500) when XAI_API_KEY is missing, distinguishing configuration issues from runtime errors
- Kept `--turbopack` build flag as it is stable in Next.js 15.5.x for production builds

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added env validation in chat API route**
- **Found during:** Task 2
- **Issue:** Chat API route had no check for missing XAI_API_KEY, would fail with opaque error in production if not configured
- **Fix:** Added `hasEnvVar('XAI_API_KEY')` check at top of POST handler returning 503 with user-friendly message
- **Files modified:** src/app/api/chat/route.ts
- **Verification:** Build passes, route returns 503 when env var missing
- **Committed in:** 89894b7 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Essential for production reliability. No scope creep.

## Issues Encountered
None

## Known Stubs
None -- all deployment configuration is complete and functional.

## User Setup Required

For AWS Amplify deployment:
1. Create an Amplify app in the AWS Console connected to this repository
2. Set `XAI_API_KEY` in Environment Variables section of the Amplify Console
3. Trigger a build -- amplify.yml will handle the rest

For local development:
1. Copy `.env.example` to `.env.local`
2. Add your xAI API key

## Next Phase Readiness
- Deployment configuration is complete and ready for AWS Amplify
- Build verified locally -- passes without errors
- All environment variable handling is in place for production

## Self-Check: PASSED

All 6 files verified present. All 3 commits verified in git history.

---
*Phase: 04-page-transitions-and-deployment*
*Completed: 2026-04-03*
