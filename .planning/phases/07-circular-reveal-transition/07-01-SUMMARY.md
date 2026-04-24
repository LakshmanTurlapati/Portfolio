---
phase: 07-circular-reveal-transition
plan: 01
subsystem: ui
tags: [view-transitions-api, web-animations-api, gsap, next.js, react, transitions, clip-path]

# Dependency graph
requires:
  - phase: 04-page-transitions-and-deployment
    provides: existing GSAP-based TransitionProvider with navigateWithReveal interface
provides:
  - View Transitions API circular reveal replacing GSAP solid-color overlay
  - ::view-transition-new(root) clip-path animation from clicked element origin
  - Dual path: View Transitions primary + GSAP fallback for unsupported browsers
  - popstate interceptor for browser back navigation with reveal from screen center
  - isTransitioningRef synchronous guard preventing rapid-click double transitions
  - CSS reset suppressing default browser cross-fade on view transitions
  - experimental.viewTransition: true in next.config.ts
affects: [08-voice-mode, any-navigation-consumer]

# Tech tracking
tech-stack:
  added: [View Transitions API (browser native), Web Animations API (browser native), experimental.viewTransition Next.js flag]
  patterns:
    - document.startViewTransition wrapping router.push for simultaneous old+new page rendering
    - transition.ready.then() with pseudoElement: ::view-transition-new(root) for clip-path animation
    - useRef guard (synchronous) + shadow useState (reactive) dual pattern for isTransitioning
    - previousPathRef tracking before router.push for popstate back navigation
    - T-07-04 safety setTimeout 600ms alongside transition.finished for guard reset reliability

key-files:
  created: []
  modified:
    - src/providers/transition-provider.tsx
    - src/app/globals.css
    - next.config.ts

key-decisions:
  - "View Transitions API as primary path with GSAP overlay as fallback (D-01, D-05)"
  - "router.push placed inside startViewTransition callback only — not before or after (Pitfall 1)"
  - "useRef for synchronous isTransitioning guard + shadow useState for reactive context value (D-13)"
  - "previousPathRef updated before router.push so popstate handler can navigate back correctly (D-08)"
  - "overlayRef div kept in JSX for GSAP fallback — never visible when View Transitions is available"
  - "Safety setTimeout 600ms added per T-07-04 threat mitigation in case transition.finished never fires"

patterns-established:
  - "Pattern: View Transitions circular reveal — startViewTransition(() => router.push) + transition.ready clip-path animation on ::view-transition-new(root)"
  - "Pattern: Dual guard — isTransitioningRef.current for synchronous blocking + setIsTransitioningState for reactive context"

requirements-completed: [TRAN-01, TRAN-02]

# Metrics
duration: 10min
completed: 2026-04-24
---

# Phase 7 Plan 01: Circular Reveal Transition Summary

**View Transitions API circular reveal replacing GSAP solid-color overlay — old page snapshot stays visible around expanding clip-path circle from clicked nav element**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-04-24T02:55:10Z
- **Completed:** 2026-04-24T03:00:52Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Replaced GSAP-only overlay approach (old page hidden before new page visible) with View Transitions API approach (old snapshot + new live page coexist during 500ms clip-path animation)
- Added GSAP fallback path for browsers without document.startViewTransition support (Chrome <111, Firefox <133, Safari <18)
- Added popstate listener for browser back button triggering reveal from screen center
- Added synchronous rapid-click guard via useRef (eliminates useState render-cycle race condition)
- Added CSS reset suppressing browser default cross-fade that would otherwise conflict with clip-path animation
- Added T-07-04 safety timer alongside transition.finished to force-reset guard if browser never fires the promise

## Task Commits

1. **Task 1: Rewrite TransitionProvider with View Transitions API primary path** - `efc25b6` (feat)
2. **Task 2: Add View Transitions CSS reset to globals.css and enable Next.js config flag** - `581960b` (feat)

## Files Created/Modified

- `src/providers/transition-provider.tsx` - Full rewrite of TransitionProvider internals: View Transitions primary path, GSAP fallback, useRef guard, previousPathRef, popstate listener
- `src/app/globals.css` - Appended ::view-transition-old/new(root) animation:none reset, isolation: auto, prefers-reduced-motion override
- `next.config.ts` - Added experimental: { viewTransition: true } block

## Decisions Made

- Used shadow useState alongside useRef for isTransitioning to maintain reactive context compatibility without breaking any consumer (approach 1 from RESEARCH.md critical detail section)
- Placed T-07-04 safety setTimeout inside transition.ready.then() (after the animation starts) rather than outside it, so the timer only runs when the primary path is active
- Kept overlayRef div in TransitionProvider JSX even though View Transitions path does not use it — required for GSAP fallback path (D-05 decision honored)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added T-07-04 safety timeout for transition.finished guard reset**
- **Found during:** Task 1 (TransitionProvider rewrite)
- **Issue:** The threat model (T-07-04, disposition: mitigate) requires a 600ms safety setTimeout alongside transition.finished to force-reset isTransitioningRef if the promise never fires (browser bug scenario). The plan's exact code listing omitted this timer from the transition.ready.then() block.
- **Fix:** Added `const safetyTimer = setTimeout(...)` inside transition.ready.then(), cleared by transition.finished.then() if it fires first
- **Files modified:** src/providers/transition-provider.tsx
- **Verification:** TypeScript compiles clean, grep confirms transition.finished and setTimeout both present
- **Committed in:** efc25b6 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical from threat model)
**Impact on plan:** Required for T-07-04 threat mitigation. No scope creep — strictly within threat model directives.

## Issues Encountered

- **Pre-existing build failure (data-grid.tsx):** `npm run build` fails due to `prefer-const` error in `src/components/data-grid.tsx` — an untracked file not modified by this plan. This is a pre-existing issue outside this plan's scope. TypeScript (`npx tsc --noEmit`) and all acceptance criteria pass. Logged to deferred items.

## Known Stubs

None — no hardcoded empty values, placeholder text, or unwired data sources introduced by this plan.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes at trust boundaries introduced.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 07-01 complete: View Transitions primary path and CSS/config infrastructure ready for 07-02 (verification/polish phase)
- Consumer files (desktop-navbar, mobile-navbar, portfolio-button, portfolio/page, about/page, chat/page) require no changes — interface preserved exactly
- Pre-existing build error in data-grid.tsx (prefer-const) must be resolved before deployment

---
*Phase: 07-circular-reveal-transition*
*Completed: 2026-04-24*
