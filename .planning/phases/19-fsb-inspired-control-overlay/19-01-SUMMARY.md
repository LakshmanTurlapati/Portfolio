---
phase: 19-fsb-inspired-control-overlay
plan: 01
subsystem: ui
tags: [react, nextjs, tailwind, css, site-control, fsb]

requires:
  - phase: 18-global-parz-site-control
    provides: Shared SiteControlProvider methods for Parz navigation, project opening, scrolling, and browser shell actions.
provides:
  - FSB-inspired monochrome overlay component for Parz control actions.
  - SiteControlProvider overlay lifecycle wrapping for text and voice control paths.
  - Global CSS for scan/grid/corner/badge visuals and reduced-motion handling.
affects: [phase-20-verification, site-control, voice-control, chat-control]

tech-stack:
  added: []
  patterns: [provider-owned transient UI lifecycle, pointer-safe global overlay, theme-aware monochrome CSS]

key-files:
  created: [src/components/fsb-control-overlay.tsx]
  modified: [src/providers/site-control-provider.tsx, src/app/globals.css]

key-decisions:
  - "Overlay lifecycle lives in SiteControlProvider so text and voice Parz actions share one trigger path."
  - "Overlay remains pointer-events-none and below the inbuilt browser layer so controls stay usable."
  - "Reduced-motion users keep static overlay marks and badge without scan animation."

patterns-established:
  - "Wrap Parz control methods with runWithControlOverlay for visible bounded control feedback."
  - "Use --fsb-overlay-rgb for light/dark monochrome inversion without adding colored branding."

requirements-completed: [FSB-01, FSB-02, FSB-03]

duration: 25min
completed: 2026-04-26
---

# Phase 19: FSB-Inspired Control Overlay Summary

**Theme-aware monochrome FSB overlay and badge now appear around Parz site-control actions without blocking portfolio controls**

## Performance

- **Duration:** 25 min
- **Started:** 2026-04-26T00:00:00Z
- **Completed:** 2026-04-26T00:25:00Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Added `FsbControlOverlay`, a hydration-safe client component with the required `powered by FSB` badge and screen-reader live status.
- Wrapped shared `SiteControlProvider` actions with `runWithControlOverlay` so navigation, project opening, scrolling, browser shell actions, and unsupported iframe refusals trigger the overlay.
- Added monochrome scan/grid/corner/crosshair CSS with responsive density and reduced-motion handling.

## Task Commits

1. **Tasks 1-3: Overlay component, provider lifecycle, and CSS** - `8ba215a` (feat)

**Plan metadata:** `d79fe62` (docs: research and implementation plan)

## Files Created/Modified

- `src/components/fsb-control-overlay.tsx` - New pointer-safe overlay component with badge and accessibility status.
- `src/providers/site-control-provider.tsx` - Adds transient overlay state and wraps Parz control methods with the overlay lifecycle.
- `src/app/globals.css` - Adds FSB overlay scan/grid/corner/badge visuals and reduced-motion CSS.

## Decisions Made

- Used a provider-owned lifecycle rather than VoiceBus-only events so text chat and voice controls behave identically.
- Kept cross-page `scrollTo` from calling `navigate()` internally to avoid triggering nested overlay timers for one command.
- Used a 900ms minimum visible duration to avoid flicker while still clearing cleanly after action results.

## Deviations from Plan

### Auto-fixed Issues

**1. Timer type correction**
- **Found during:** Build verification
- **Issue:** `ReturnType<typeof window.setTimeout>` conflicted with the project type environment and produced `Type 'number' is not assignable to type 'Timeout'.`
- **Fix:** Narrowed the overlay timer ref to `number | null`, matching browser `window.setTimeout`.
- **Files modified:** `src/providers/site-control-provider.tsx`
- **Verification:** `npm run build` passes.
- **Committed in:** `8ba215a`

**2. Nested overlay lifecycle prevention**
- **Found during:** Self-review after verification
- **Issue:** Cross-page `scrollTo` called `navigate('about')`, which would start a nested overlay lifecycle inside the outer `scrollTo` lifecycle.
- **Fix:** `scrollTo` now calls `navigateWithReveal(PAGE_PATHS.about, ...)` directly while the outer lifecycle owns the overlay timing.
- **Files modified:** `src/providers/site-control-provider.tsx`
- **Verification:** `npm run lint` and `npm run build` pass.
- **Committed in:** `8ba215a`

---

**Total deviations:** 2 auto-fixed (1 type fix, 1 lifecycle refinement)
**Impact on plan:** Both changes preserve the planned scope and improve correctness.

## Issues Encountered

- `npm run lint` reports 7 existing warnings in unrelated files; no new lint errors were introduced.

## User Setup Required

None - no external service configuration required.

## Verification

- `npm run lint` passes with existing warnings only.
- `npm run build` passes.
- Grep checks confirmed required component, provider, CSS, badge, accessibility, and reduced-motion patterns.

## Next Phase Readiness

Phase 20 can add Playwright coverage for text/voice Parz actions showing and clearing the overlay, including the `powered by FSB` badge and pointer-safe behavior.

---
*Phase: 19-fsb-inspired-control-overlay*
*Completed: 2026-04-26*
