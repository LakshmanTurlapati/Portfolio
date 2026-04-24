---
phase: 09-chat-about-and-polish
plan: 02
subsystem: ui
tags: [react, nextjs, css-custom-properties, spotlight, animation]

requires:
  - phase: 09-chat-about-and-polish-01
    provides: chat polish and DATA_STORE name normalization

provides:
  - SpotlightEffect rewritten to CSS custom property approach matching v3 prototype

affects:
  - about-page rendering
  - spotlight visual behavior on cursor movement

tech-stack:
  added: []
  patterns:
    - "CSS custom property spotlight: --mx/--my set via el.style.setProperty on mousemove, consumed by radial-gradient in inline style — zero-lag, no timer loop"

key-files:
  created: []
  modified:
    - src/components/spotlight.tsx

key-decisions:
  - "SpotlightEffect uses CSS custom properties --mx/--my updated synchronously on mousemove — eliminates setInterval/lerp overhead entirely"
  - "Spotlight opacity toggled on mousemove/mouseleave (0.3s ease transition) instead of background mutation -- cleaner show/hide"
  - "Removed blur(100px) filter -- v3 prototype has none; it was overly aggressive"
  - "500px radius circle matches v3 prototype; previous implementation used 275px"

patterns-established:
  - "CSS custom property driven spotlight: attach mousemove to document, call el.style.setProperty for pixel coords, consume in CSS radial-gradient"

requirements-completed: [ABUT-01]

duration: 5min
completed: 2026-04-23
---

# Phase 09 Plan 02: SpotlightEffect CSS Custom Property Rewrite Summary

**SpotlightEffect rewritten from setInterval/lerp background-mutation to synchronous CSS custom property approach -- cursor coords set via el.style.setProperty('--mx') consumed by radial-gradient, matching v3 prototype exactly**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-23T00:20:00Z
- **Completed:** 2026-04-23T00:25:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Replaced 62-line setInterval/lerp implementation with a clean 46-line CSS custom property approach
- Zero-lag cursor tracking: `--mx`/`--my` updated synchronously on every mousemove event (no 20ms timer delay)
- Spotlight fades in on first cursor move, fades out on cursor leave (opacity 0.3s ease transition)
- `--color-spotlight` CSS variable continues driving light/dark theme adaptation automatically
- Removed overly aggressive `blur(100px)` filter absent from v3 prototype
- Radius corrected from 275px to 500px matching v3 prototype spec

## Task Commits

1. **Task 1: Rewrite SpotlightEffect to CSS custom property approach** - `4019daf` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/components/spotlight.tsx` - Complete rewrite: removed setInterval/lerp/direct-background-mutation; now uses mousemove setProperty for --mx/--my consumed by radial-gradient inline style; opacity toggle for show/hide

## Decisions Made

- Used `el.style.setProperty('--mx', e.clientX + 'px')` instead of absolute positioning computed from getBoundingClientRect — v3 prototype also uses raw clientX/clientY which works because the spotlight covers the full viewport with `position: absolute; inset: 0`
- Opacity transition chosen over background mutation for spotlight visibility — cleaner CSS, no per-frame JS work
- Document-level mouseleave (not container-level) for consistent hide behavior when cursor exits the browser window

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- SpotlightEffect is ready; About page uses `<SpotlightEffect />` unchanged (same export name, no page.tsx edits needed)
- Plan 03 can proceed immediately

## Self-Check: PASSED

- `src/components/spotlight.tsx` exists and contains `setProperty('--mx', ...)` and `var(--mx)` in radial-gradient
- Commit `4019daf` confirmed in git log
- TypeScript compile: no errors
- No `setInterval` in spotlight.tsx

---
*Phase: 09-chat-about-and-polish*
*Completed: 2026-04-23*
