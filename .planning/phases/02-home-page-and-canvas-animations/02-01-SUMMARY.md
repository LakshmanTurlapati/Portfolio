---
phase: 02-home-page-and-canvas-animations
plan: 01
subsystem: ui
tags: [canvas, animation, requestAnimationFrame, ResizeObserver, useRef, CSS-custom-properties]

# Dependency graph
requires:
  - phase: 01-app-shell-and-navigation
    provides: "useMediaQuery hook, useMounted hook, globals.css with Phase 1 tokens, project foundation"
provides:
  - "useCanvas shared hook for rAF lifecycle, ResizeObserver, DPR scaling, cleanup"
  - "ParticleBackground component with pre-rendered blur stamps"
  - "SnowfallEffect component with 3-layer depth and mouse drift"
  - "Phase 2 CSS custom properties (--color-snow, --color-dot-start/end, --color-spotlight, --color-circular-text/bullet, --color-arrow-icon)"
  - "Utility classes: animate-spin-slow, scroll-roller-mask, dot-matrix-fade-mask, dot-matrix-dot:hover"
affects: [02-02, 02-03, 02-04]

# Tech tracking
tech-stack:
  added: []
  patterns: [useCanvas-hook, pre-rendered-blur-stamps, imperative-canvas-animation, CSS-custom-property-theming]

key-files:
  created:
    - src/hooks/use-canvas.ts
    - src/components/particle-background.tsx
    - src/components/snowfall.tsx
  modified:
    - src/app/globals.css

key-decisions:
  - "Single CSS blur(1px) on snowfall canvas element instead of per-layer blur -- visual difference minimal at snowflake scale, avoids 3 separate canvases"
  - "Pre-rendered blur stamps via offscreen canvas -- avoids per-frame ctx.filter which tanks performance"
  - "All animation state in useRef, zero useState for per-frame data -- prevents 60 React reconciliation cycles per second"

patterns-established:
  - "useCanvas hook: standard pattern for all canvas-based effects (rAF, ResizeObserver, DPR, cleanup)"
  - "Imperative canvas animation: useRef for mutable state, ctx draw calls in rAF callback, React renders canvas once"
  - "Theme colors via CSS custom properties: read getComputedStyle at draw time, zero React re-renders on theme change"

requirements-completed: [ANIM-01, ANIM-02, ANIM-06, ANIM-07]

# Metrics
duration: 3min
completed: 2026-04-03
---

# Phase 2 Plan 1: Canvas Animation Infrastructure Summary

**Shared useCanvas hook with rAF/ResizeObserver/DPR lifecycle, ParticleBackground with pre-rendered blur stamps (7 desktop / 4 mobile), SnowfallEffect with 3-layer depth system and mouse drift (220 desktop / 110 mobile)**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-03T19:46:31Z
- **Completed:** 2026-04-03T19:49:05Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- Created shared useCanvas hook handling rAF loop, ResizeObserver resize, devicePixelRatio scaling, and cleanup
- Extended globals.css with 7 Phase 2 CSS custom properties in both light and dark modes, plus 4 utility classes
- Built ParticleBackground component with pre-rendered blur stamps via offscreen canvas (7 circles desktop, 4 mobile)
- Built SnowfallEffect component with 3 depth layers (back/mid/front), mouse drift influence, and theme-aware snow color

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useCanvas hook and add Phase 2 CSS custom properties** - `490f4de` (feat)
2. **Task 2: Build ParticleBackground canvas component with pre-rendered blur stamps** - `b1de870` (feat)
3. **Task 3: Build Snowfall canvas component with 3-layer depth system and mouse drift** - `c80049a` (feat)

## Files Created/Modified
- `src/hooks/use-canvas.ts` - Shared canvas animation hook with rAF loop, ResizeObserver, DPR scaling, cleanup
- `src/components/particle-background.tsx` - Canvas-based floating gradient circles with pre-rendered blur stamps
- `src/components/snowfall.tsx` - Canvas-based 3-layer snow particle system with mouse drift
- `src/app/globals.css` - Phase 2 CSS custom properties and utility classes (spin-slow, scroll-roller-mask, dot-matrix-fade-mask, dot-matrix-dot:hover)

## Decisions Made
- Used single CSS blur(1px) on snowfall canvas element rather than 3 separate canvases with per-layer blur. The visual difference between per-layer blur (sigma 2.0, 0.1, 1.0) and single 1px is minimal at these snowflake sizes, and this approach respects the CONTEXT.md decision of "one canvas per effect."
- Pre-rendered blur stamps via offscreen canvas for particle background, avoiding per-frame ctx.filter which is extremely expensive (software-rendered blur recalculated every frame).
- All animation state stored in useRef exclusively. Zero useState for per-frame data, preventing React reconciliation overhead at 60fps.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all components are fully functional with real data sources.

## Next Phase Readiness
- useCanvas hook ready for any future canvas-based effects
- ParticleBackground and SnowfallEffect ready to be composed into the home page layout (Plan 04)
- Phase 2 CSS custom properties available for dot matrix (Plan 02), rotating circular text (Plan 03), and spotlight (Plan 03)
- Utility classes (animate-spin-slow, scroll-roller-mask, dot-matrix-fade-mask) ready for Plans 02 and 03

## Self-Check: PASSED

All 4 created/modified files verified present. All 3 task commits verified in git log.

---
*Phase: 02-home-page-and-canvas-animations*
*Completed: 2026-04-03*
