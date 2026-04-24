---
phase: 08-voice-mode
plan: 04
subsystem: ui
tags: [particles, voicebus, raf, animation, typescript, breathing]

# Dependency graph
requires:
  - phase: 08-voice-mode/08-01
    provides: window.VoiceBus singleton with level + state fields read synchronously in rAF
  - phase: 06-home-page-and-ambient-backgrounds
    provides: particle-background.tsx with pJSDom cleanup pattern and particlesJS() init
provides:
  - ParticleBackground with VoiceBus breathing rAF loop
  - waitForInst polls pJSDom until populated, captures baselines, runs tick loop
  - thinking state: 3.2 Hz pulse + 11 Hz spark expands line_linked.distance 1.35-1.70x
  - level > 0 state: two-sine breath (1.6 Hz) + ripple (4.2 Hz), 65/35 weighted, per-particle i*0.18 phase offset
  - level = 0 state: all values snap back to captured baselines
  - __vmTick cancellation slot on container DOM node for cleanup + reinit safety
affects:
  - Any future plan that tests particle breathing behavior

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "waitForInst polling pattern: poll window.pJSDom up to 40 times (2s) before giving up — prevents hung loops if pJS never populates"
    - "cancel-before-destroy order: __vmTick cancelled before pJS destroypJS() on every reinit — prevents stale baseline references on theme switch"
    - "__vmTick slot on DOM node: stores rAF cancellation function directly on containerRef.current so cleanup can call it without React state"
    - "synchronous window global read in rAF: tick() reads window.VoiceBus.level directly — zero React re-renders at 60fps"

key-files:
  created: []
  modified:
    - src/components/particle-background.tsx

key-decisions:
  - "Window.pJSDom type expanded in-file to include particles.array and line_linked fields — enables TS-safe direct mutation of pJS internals without type assertions on every access"
  - "ParticleContainer = HTMLDivElement & { __vmTick? } declared as module-level type alias — collocated with usage in particle-background.tsx, not in global voice-bus.d.ts, because __vmTick is a particle-background-specific implementation detail"
  - "breathCancelled + breathRaf are local variables inside init(), not React state — guarantees zero re-renders; each init() call gets a fresh closure"

patterns-established:
  - "Pattern: rAF loop with __vmTick cancellation slot — DOM node stores () => void cancellation handle; cleanup and reinit call it before any destroy"

requirements-completed: [VOIC-04]

# Metrics
duration: 5min
completed: 2026-04-24
---

# Phase 8 Plan 04: Particle Breathing rAF Loop Summary

**VoiceBus-driven particle mesh breathing via waitForInst + tick rAF loop — two-sine breath+ripple (1.6 Hz / 4.2 Hz, 65/35) for speaking/listening, 3.2 Hz pulse + 11 Hz spark for thinking, baseline restore at idle, cancel-before-destroy on theme switch**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-24T06:42:00Z
- **Completed:** 2026-04-24T06:47:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Ported waitForInst + tick loop verbatim from home.jsx lines 79-156 to TypeScript with full type safety
- Particle mesh now breathes when window.VoiceBus.level > 0 (two-sine wave, 65/35 weighted, per-particle i*0.18 phase offset prevents lockstep pulsing)
- Thinking state expands line_linked.distance 1.35-1.70x with 3.2 Hz pulse + 11 Hz spark modulating opacity
- Old breathing rAF cancelled before pJS reinit on theme change — no stale baseline references (T-08-16 mitigated)
- Breathing loop produces zero React re-renders (synchronous window global read in rAF tick)
- waitForInst gives up after 40 tries (2s) — no infinite poll if pJS never populates (T-08-17 mitigated)
- useEffect cleanup cancels rAF on unmount — no leak after component teardown (T-08-15 mitigated)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add VoiceBus breathing rAF loop to ParticleBackground** - `bc91d46` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/components/particle-background.tsx` - Extended Window.pJSDom type, added ParticleContainer alias, cancel-before-destroy guard, full waitForInst + tick breathing loop, cleanup cancellation

## Decisions Made
- Window.pJSDom type expanded inline (not in voice-bus.d.ts) because the particle structure fields are specific to the breathing implementation, not a VoiceBus concern
- ParticleContainer type alias defined at module level in particle-background.tsx — collocated with its only usage
- breathCancelled and breathRaf are closure-local variables (not React state) — ensures zero re-renders and each init() gets a fresh, isolated loop

## Deviations from Plan

None - plan executed exactly as written. All four additions (type extension, cancel-before-destroy, waitForInst+tick loop, cleanup cancel) applied as specified.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Particle breathing is complete and self-contained in particle-background.tsx
- window.VoiceBus.setState('thinking') or window.VoiceBus.setLevel(0.5) will immediately drive the breathing animation
- All three STRIDE threats (T-08-15, T-08-16, T-08-17) are mitigated
- Phase 8 plans 01-04 are complete; only plan 05 (integration/final wiring) remains

---
*Phase: 08-voice-mode*
*Completed: 2026-04-24*
