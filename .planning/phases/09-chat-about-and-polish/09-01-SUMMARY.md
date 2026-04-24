---
phase: 09-chat-about-and-polish
plan: 01
subsystem: ui
tags: [chat, ai, persona, error-handling, system-prompt]

# Dependency graph
requires:
  - phase: 08-voice-mode
    provides: chat surfaces (chat/page.tsx, chat-popup.tsx) already wired with useChat hook
provides:
  - Parz-persona friendly error messages in both chat surfaces (no raw error.message leakage)
  - DATA_STORE project names aligned with projects.ts (all 21 canonical names match)
affects: [future chat improvements, AI persona accuracy]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - PARZ_ERRORS array + currentError state + useEffect watching error — opaque error display pattern for chat surfaces
    - DATA_STORE name alignment strategy — project names in system-prompt.ts must match projects.ts exactly

key-files:
  created: []
  modified:
    - src/app/chat/page.tsx
    - src/components/chat-popup.tsx
    - src/data/system-prompt.ts

key-decisions:
  - "PARZ_ERRORS displayed via currentError state (useEffect on error) — never leak raw error.message to UI per T-09-01 threat mitigation"
  - "DATA_STORE project names normalized to match projects.ts displayed names exactly so Parz can answer questions about all 21 projects"

patterns-established:
  - "Opaque error pattern: useEffect on error sets currentError from random array; JSX guards on currentError not raw error"

requirements-completed: [CHAT-01, CHAT-02, CHAT-03]

# Metrics
duration: 15min
completed: 2026-04-23
---

# Phase 09 Plan 01: Chat Polish Summary

**Parz-persona random error messages replace raw error.message in both chat surfaces, and all 21 DATA_STORE project names now match projects.ts exactly**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-04-23T00:00:00Z
- **Completed:** 2026-04-23T00:15:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Added 7-item PARZ_ERRORS array to both chat/page.tsx and chat-popup.tsx; error display now shows a random casual message, never a raw technical error string (T-09-01 mitigation complete)
- Fixed 5 project name mismatches in DATA_STORE: Review-Gate (V2) -> Review Gate, t2s-cli -> T2S CLI, open-api -> Open-API, DCTE-Script (X-Read) -> X-Read, Asteroids Multiplayer -> Asteroids Game
- Verified all 21 canonical project names from projects.ts are present in DATA_STORE; LinkedIn Auto Connect and awsxUTD-Hackathon were already correct
- TypeScript compiles clean; suggestion chips (1 small + 1 big, disappear after 2 messages) and loading message cycling (every 3s) confirmed correct by code inspection

## Task Commits

1. **Task 1: Add Parz-persona error messages to both chat surfaces** - `7918365` (feat)
2. **Task 2: Audit and fix DATA_STORE project names** - `2bfd5e9` (fix)

## Files Created/Modified

- `src/app/chat/page.tsx` - Added PARZ_ERRORS array, currentError state, useEffect on error, replaced error.message display with currentError
- `src/components/chat-popup.tsx` - Same PARZ_ERRORS pattern applied identically
- `src/data/system-prompt.ts` - Fixed 5 project name mismatches so all 21 portfolio projects are recognizable to Parz

## Decisions Made

- currentError state (not direct error display) chosen so random selection is stable per error occurrence — picks once on error arrival, not on every render
- DATA_STORE descriptions kept intact; only the "name" field was normalized to match projects.ts displayed names

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- The t2s-cli entry had the "name" and "url" on separate lines (not inline JSON), so the first edit attempt failed due to formatting mismatch. Re-read the file to get exact content, then applied the fix correctly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Chat error surfaces are clean and on-brand; no raw technical strings leak to users
- Parz AI has accurate coverage of all 21 portfolio projects by their displayed names
- Ready for Phase 09 Plan 02 (about page / remaining polish tasks)

---
*Phase: 09-chat-about-and-polish*
*Completed: 2026-04-23*
