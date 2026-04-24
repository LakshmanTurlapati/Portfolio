---
phase: 11-iframeviewer-browser-previews
plan: 01
subsystem: ui
tags: [react, nextjs, typescript, iframe, portfolio]

# Dependency graph
requires:
  - phase: 10-circular-reveal-fix
    provides: IframeViewer component with GithubPreview, unembeddable detection, 8s load timer, Escape-to-close
provides:
  - isUnembeddable exported from iframe-viewer.tsx for external consumers
  - openProject in portfolio/page.tsx routes card clicks directly to IframeViewer with 4-step link priority
affects: [portfolio, iframe-viewer, project-detail]

# Tech tracking
tech-stack:
  added: []
  patterns: [link-priority routing — embeddable Website > Design > unembeddable Website > GitHub]

key-files:
  created: []
  modified:
    - src/components/iframe-viewer.tsx
    - src/app/portfolio/page.tsx

key-decisions:
  - "isUnembeddable exported directly from iframe-viewer.tsx rather than duplicated in portfolio/page.tsx — single source of truth for embeddability checks"
  - "openProject calls setViewer directly, never setSelectedProject — card click UX matches v3 D-01/D-02 prototype"
  - "selectedProject state and ProjectDetail JSX block retained unchanged — ProjectDetail still accessible via onOpenLink from card link buttons (D-03 secondary access path)"

patterns-established:
  - "Link-priority routing: embeddable Website > Design (Figma) > unembeddable Website (fallback CTA) > GitHub (GithubPreview)"

requirements-completed: [PORT-06, PORT-07]

# Metrics
duration: 1min
completed: 2026-04-24
---

# Phase 11 Plan 01: IframeViewer Browser Previews Summary

**Card clicks now open IframeViewer directly with 4-step link-priority routing (embeddable Website > Design > unembeddable Website > GitHub), replacing the previous side-panel behavior**

## Performance

- **Duration:** 1 min
- **Started:** 2026-04-24T19:23:23Z
- **Completed:** 2026-04-24T19:24:21Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Exported `isUnembeddable` from `iframe-viewer.tsx` so portfolio page can import it without duplicating logic
- Rewrote `openProject` callback in `portfolio/page.tsx` with 4-step link-priority routing that calls `setViewer` directly
- Card click now immediately opens IframeViewer — no side panel on direct card click
- ProjectDetail remains accessible via `onOpenLink` from card link buttons (secondary access path preserved)

## Task Commits

Each task was committed atomically:

1. **Task 1: Export isUnembeddable from iframe-viewer.tsx** - `c907180` (feat)
2. **Task 2: Rewrite openProject to open IframeViewer directly** - `231f07e` (feat)

**Plan metadata:** `(pending final commit)` (docs: complete plan)

## Files Created/Modified
- `src/components/iframe-viewer.tsx` - Added `export` keyword to `isUnembeddable` function declaration
- `src/app/portfolio/page.tsx` - Updated IframeViewer import to include `isUnembeddable`; replaced `openProject` body with link-priority routing to `setViewer`

## Decisions Made
- `isUnembeddable` exported directly from `iframe-viewer.tsx` rather than duplicated — single source of truth
- `openProject` calls `setViewer` directly rather than going through `openInViewer` helper — avoids unnecessary indirection; both paths arrive at the same state setter
- `selectedProject` state and `ProjectDetail` JSX block retained intact — plan explicitly requires D-03 secondary access path to remain working

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Card-click UX now matches v3 prototype D-01/D-02 fully
- IframeViewer receives best embeddable URL for each project card
- GitHub-only projects show GithubPreview; Figma links embed; unembeddable sites show fallback CTA
- No blockers for subsequent phases

---
*Phase: 11-iframeviewer-browser-previews*
*Completed: 2026-04-24*
