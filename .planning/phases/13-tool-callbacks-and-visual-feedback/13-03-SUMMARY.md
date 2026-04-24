---
phase: 13-tool-callbacks-and-visual-feedback
plan: "03"
subsystem: ui
tags: [voice, voice-callbacks, voice-controller, VoiceBus, portfolio, about, tour, next.js, react]

# Dependency graph
requires:
  - phase: 13-01
    provides: registerToolCallbacks API in VoiceSessionProvider + ToolCallbacks interface in voice-controller.ts
  - phase: 13-02
    provides: VoiceGlow component and CSS keyframes (sibling wave 2 plan)
provides:
  - openProject voice callback in portfolio/page.tsx (slug → setSelectedProject → ProjectDetail overlay)
  - page-ready signal emitted from portfolio/page.tsx on mount
  - scrollTo voice callback in about/page.tsx (selector → alias map → scrollToSection)
  - page-ready signal emitted from about/page.tsx on mount
  - Callback deregistration on unmount for both pages
affects: [13-04, voice-tour, TOOL-01, TOOL-03, TOOL-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Per-page useEffect callback registration: registerToolCallbacks({...}) on mount, registerToolCallbacks({}) on unmount"
    - "VoiceBus page-ready emission: SSR-guarded window.VoiceBus.emit('page-ready', pageName) in empty-dep useEffect"
    - "Slug lookup with case-sensitive first + case-insensitive fallback for voice-spoken project names"
    - "Voice selector alias map: idMap Record<string, SectionId> normalizes AI-produced selectors to valid section IDs"

key-files:
  created: []
  modified:
    - src/app/portfolio/page.tsx
    - src/app/about/page.tsx

key-decisions:
  - "openProject voice callback calls setSelectedProject directly (not the local openProject function) — local openProject opens IframeViewer, not ProjectDetail overlay"
  - "scrollTo callback delegates to existing scrollToSection() — about page scrolls a div container, not window; scrollToSection uses ref.current.scrollIntoView"
  - "Alias map in scrollTo callback normalizes 'work'→experience, 'education'/'school'→academics so natural speech works"

patterns-established:
  - "Page-level voice registration pattern: import useVoiceSession, destructure registerToolCallbacks, mount/unmount useEffect pair"
  - "page-ready emission: separate empty-dep useEffect with typeof window !== 'undefined' && window.VoiceBus SSR guard"

requirements-completed: [TOOL-01, TOOL-03, TOOL-06]

# Metrics
duration: 8min
completed: 2026-04-24
---

# Phase 13 Plan 03: Tool Callbacks and Visual Feedback Summary

**openProject and scrollTo voice callbacks wired in portfolio and about pages, both emitting VoiceBus page-ready on mount to unblock the tour handshake**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-04-24T00:00:00Z
- **Completed:** 2026-04-24T00:08:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- portfolio/page.tsx registers `openProject` callback: slug lookup (case-sensitive first, case-insensitive fallback) calls `setSelectedProject` to open the ProjectDetail overlay — Tour step 4 (Parz-AI) now resolves end-to-end
- about/page.tsx registers `scrollTo` callback: strips `#`, maps aliases (work→experience, education/school→academics), delegates to existing `scrollToSection()` which correctly scrolls the right-panel div
- Both pages emit `VoiceBus.emit('page-ready', pageName)` on mount (SSR-guarded), unblocking the tour's `waitForPage` Promise.race
- Both pages deregister callbacks on unmount via `return () => registerToolCallbacks({})` preventing stale handler buildup

## Task Commits

1. **Task 1: Register openProject callback and emit page-ready in portfolio/page.tsx** - `fe00679` (feat)
2. **Task 2: Register scrollTo callback and emit page-ready in about/page.tsx** - `565123c` (feat)

**Plan metadata:** (final commit hash below)

## Files Created/Modified
- `src/app/portfolio/page.tsx` - Added useVoiceSession import, registerToolCallbacks destructure, openProject useEffect (slug→Project→setSelectedProject), page-ready useEffect
- `src/app/about/page.tsx` - Added useVoiceSession import, registerToolCallbacks destructure, scrollTo useEffect (alias map→scrollToSection), page-ready useEffect

## Decisions Made
- openProject callback calls `setSelectedProject(project)` directly rather than the local `openProject()` function — the local function opens the IframeViewer, but voice navigation to a project should open the richer ProjectDetail overlay (consistent with PATTERNS.md Key Observation #2)
- scrollTo callback delegates entirely to the existing `scrollToSection()` useCallback — avoids duplicating scroll logic and correctly handles the scrollable div container rather than window scroll
- Alias map (`work`→experience, `education`/`school`→academics) covers natural speech variations the AI TTS will produce so user commands work without exact phrasing

## Deviations from Plan

None - plan executed exactly as written.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. Both callbacks operate on:
- Hardcoded projects array (T-13-06: no-op on unmatched slug)
- Hardcoded idMap (T-13-07: only 'about'/'experience'/'academics' pass; all other selectors produce no scroll)

Both mitigations from the plan's threat model are in place.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- TOOL-01 (openProject), TOOL-03 (scrollTo), TOOL-06 (tour page-ready) are fully wired
- Plan 13-04 (the remaining phase plan) can proceed — the complete voice tool chain is now end-to-end
- No blockers

---
*Phase: 13-tool-callbacks-and-visual-feedback*
*Completed: 2026-04-24*
