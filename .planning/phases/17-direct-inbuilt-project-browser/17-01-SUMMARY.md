---
phase: 17
plan: 01
subsystem: project-resolution
tags:
  - project-browser
  - safety
  - aliases
key-files:
  - src/data/projects.ts
metrics:
  tasks_completed: 2
  verification: passed
---

# Plan 17-01 Summary: Canonical Project Resolver and Approved Browser Targets

## Commits

| Commit | Description |
|--------|-------------|
| ec4495e | Added project aliases, preferred browser targets, resolver helpers, and approved URL guard helpers. |

## Completed

- Extended `Project` records with optional aliases and preferred target metadata.
- Added aliases for FSB / Full Self Browsing, GitFly, Review Gate, T2S CLI, and Parz-AI.
- Added `allProjects`, `resolveProject`, `isApprovedProjectUrl`, and `getProjectBrowserTarget` helpers.
- Kept GitFly restricted to `https://gitfly.ai` with no private source target.

## Deviations

- None.

## Verification

- `npm run lint` passed with pre-existing warnings.
- `npm run build` passed with pre-existing warnings.

## Self-Check: PASSED

Plan acceptance criteria were met.
