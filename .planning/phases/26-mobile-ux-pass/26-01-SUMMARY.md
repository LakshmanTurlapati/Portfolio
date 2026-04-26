---
phase: 26-mobile-ux-pass
plan: 01
subsystem: ui
tags: [particles, mobile, matchMedia, react-hooks, performance]

# Dependency graph
requires:
  - phase: 24-mobile-pass-and-voice-stabilization
    provides: src/hooks/use-media-query.ts (SSR-safe matchMedia hook reused unchanged)
provides:
  - Mobile-aware particle count (45 on <768px, 90 on >=768px) via existing useMediaQuery subscription
  - Reinit on 768px breakpoint cross through existing teardown sequence (destroy -> clear -> remove canvas -> particlesJS)
affects: [26-02-ios-keyboard, 26-03-project-detail-mobile, future mobile performance work, future particle-background tuning]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Mobile detection via useMediaQuery('(max-width: 768px)') (no innerWidth polling, no resize listener)"
    - "Breakpoint-driven config switch threaded through useEffect deps to leverage existing teardown-and-reinit cycle"

key-files:
  created: []
  modified:
    - src/components/particle-background.tsx

key-decisions:
  - "Mobile particle count fixed at 45 (mid-point of ROADMAP's 40-50 range, locked in 26-CONTEXT.md D-MOB-01)"
  - "Breakpoint at 768px (Tailwind md default) -- iPad portrait at exactly 768px receives desktop count (90)"
  - "No fps cap on the breathing rAF loop; lower particle count alone is sufficient per UI-SPEC"
  - "Reuse existing useMediaQuery hook + existing teardown sequence rather than introducing window.innerWidth polling"

patterns-established:
  - "Mobile-aware canvas/animation tuning: subscribe via useMediaQuery, thread the boolean into useEffect deps, let the existing teardown reinit on cross"

requirements-completed: [MOB-01]

# Metrics
duration: ~1 min
completed: 2026-04-26
---

# Phase 26 Plan 01: Mobile Particle Count Reduction Summary

**ParticleBackground now emits 45 particles on mobile (<768px) vs. 90 on tablet/desktop via a useMediaQuery('(max-width: 768px)') subscription, with reinit on breakpoint cross handled by the existing teardown sequence.**

## Performance

- **Duration:** ~1 min (single surgical change, three edits to one file)
- **Started:** 2026-04-26T21:47:57Z
- **Completed:** 2026-04-26T21:49:01Z
- **Tasks:** 2 (1 auto + 1 checkpoint auto-approved)
- **Files modified:** 1

## Accomplishments
- Halved mobile particle count (90 -> 45) without touching density area, line distance, move speed, palette, or the breathing rAF loop
- Threaded `isMobile` into the `useEffect` deps so the existing destroy-and-reinit sequence handles 768px crossings cleanly
- Reused the project's existing `useMediaQuery` hook (no new infra, no new dependencies)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add mobile particle count switch via useMediaQuery** - `5088c05` (feat)
2. **Task 2: Manual mobile particle smoothness verification** - auto-approved per autonomous mode (no commit; manual mobile validation deferred to phase HUMAN-UAT.md)

## Files Created/Modified
- `src/components/particle-background.tsx` - Added `useMediaQuery` import; derived `isMobile` from `(max-width: 768px)`; switched `particles.number.value` to `isMobile ? 45 : 90`; added `isMobile` to the `useEffect` dependency array

## The 4 Changes (Task 1)

1. **Import added** (line 6): `import { useMediaQuery } from '@/hooks/use-media-query';`
2. **`isMobile` derivation added** (line 56): `const isMobile = useMediaQuery('(max-width: 768px)');`
3. **Particle count made mobile-aware** (line 86): `number: { value: isMobile ? 45 : 90, density: { enable: true, value_area: 900 } },`
4. **`useEffect` deps extended** (line 205): `}, [isDark, mounted, isMobile]);`

## Confirmation: No Forbidden Patterns Introduced

| Forbidden pattern (per UI-SPEC) | grep result | Status |
|---|---|---|
| `innerWidth` polling | 0 matches | absent |
| `addEventListener('resize` | 0 matches | absent |
| New fps cap / throttle on breathing rAF loop | none introduced | breathing loop logic at lines 111-194 untouched |
| `value_area` change | still `900` | preserved |
| `line_linked.distance` change | still `150` | preserved |
| `move.speed` change | still `1.2` | preserved |
| Palette change | none | preserved |

## Manual Verification Result (Task 2)

**Auto-approved per autonomous mode -- manual mobile validation deferred to phase HUMAN-UAT.md**

The phase is running under `/gsd-autonomous` with locked decisions in `26-CONTEXT.md` and `26-UI-SPEC.md`. Per the auto-mode contract, the `checkpoint:human-verify` task was auto-approved without halting. The full manual verification script (DevTools device toolbar at iPhone SE / iPhone 14 Pro / iPad portrait, breakpoint-cross resize from 1200px to 700px and back, VoiceBus breathing smoothness check at 45 particles, theme toggle reinit on mobile) is recorded in the plan's `<how-to-verify>` block and queued for human UAT in a future phase.

## Decisions Made
None beyond what is locked in `26-CONTEXT.md` D-MOB-01 and the MOB-01 row of `26-UI-SPEC.md`. The implementation followed those decisions byte-for-byte.

## Deviations from Plan

None - plan executed exactly as written.

**Total deviations:** 0
**Impact on plan:** Plan was sufficiently precise that no auto-fixes (Rules 1-3) or architectural questions (Rule 4) were required. The plan's surgical line-level instructions matched the existing file shape exactly.

## Issues Encountered
None. The existing teardown sequence at lines 73-80 was already structured for reinit-on-config-change (it currently fires on `isDark` and `mounted` changes); adding `isMobile` to the deps array slots cleanly into that existing contract.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- MOB-01 complete; mobile particle smoothness should now meet the ROADMAP success criterion on iPhone SE / iPhone 14 Pro / Pixel-class devices
- 26-02 (iOS chat keyboard) and 26-03 (project-detail mobile layout) can proceed independently -- they touch different files and have no dependency on this plan's changes
- Manual mobile UAT (DevTools device emulation walkthrough from `<how-to-verify>` of Task 2) remains queued for the eventual `HUMAN-UAT.md` phase

## Self-Check: PASSED

**Files verified to exist:**
- FOUND: `src/components/particle-background.tsx` (modified)
- FOUND: `src/hooks/use-media-query.ts` (consumed unchanged, pre-existing)

**Commits verified to exist:**
- FOUND: `5088c05` (feat(26-01): switch mobile particle count to 45 via useMediaQuery)

**Code patterns verified (post-commit grep):**
- FOUND: `useMediaQuery('(max-width: 768px)')` (count >= 1)
- FOUND: `isMobile ? 45 : 90` (count = 1)
- FOUND: `value_area: 900` (count = 1; density unchanged)
- FOUND: `distance: 150` (count = 1; line distance unchanged)
- FOUND: `speed: 1.2` (count = 1; move speed unchanged)
- FOUND: `[isDark, mounted, isMobile]` (deps array exact match)
- ABSENT (good): `innerWidth` (count = 0)
- ABSENT (good): `addEventListener('resize` (count = 0)
- PASSED: `npx tsc --noEmit -p .` (exit 0, clean compile)

---
*Phase: 26-mobile-ux-pass*
*Completed: 2026-04-26*
