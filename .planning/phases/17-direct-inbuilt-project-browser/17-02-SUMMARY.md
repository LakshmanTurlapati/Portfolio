---
phase: 17
plan: 02
subsystem: portfolio-browser
tags:
  - portfolio
  - iframe-viewer
  - voice-tools
key-files:
  - src/app/portfolio/page.tsx
  - src/app/api/chat/route.ts
metrics:
  tasks_completed: 3
  verification: passed
---

# Plan 17-02 Summary: Portfolio Direct Browser Opening and Tool Copy Alignment

## Commits

| Commit | Description |
|--------|-------------|
| ec4495e | Replaced the portfolio detail-panel open path with direct approved browser targets and updated voice tool copy. |

## Completed

- Removed `ProjectDetail` from the primary portfolio render path.
- Updated project card opening to use `getProjectBrowserTarget` and set `IframeViewer` directly.
- Updated portfolio-local `openProject` voice callback to resolve aliases through `resolveProject` and use the same direct browser path.
- Updated chat/voice tool copy so project opening uses approved project names/aliases and does not invent URLs.

## Deviations

- Unknown portfolio-local project tool calls log a warning and do not open anything. A user-visible global fallback is deferred to Phase 18's global site-control layer.

## Verification

- `npm run lint` passed with pre-existing warnings.
- `npm run build` passed with pre-existing warnings.

## Self-Check: PASSED

Plan acceptance criteria were met.
