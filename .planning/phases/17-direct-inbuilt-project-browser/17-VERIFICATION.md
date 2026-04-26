---
phase: 17
status: passed
verified: 2026-04-26
---

# Phase 17 Verification: Direct Inbuilt Project Browser

## Status

status: passed

## Automated Checks

| Check | Result | Notes |
|-------|--------|-------|
| `npm run lint` | passed | 0 errors; 10 pre-existing warnings remain. |
| `npm run build` | passed | Production build and type checks passed; same pre-existing warnings remain. |

## Success Criteria

| Criterion | Result | Evidence |
|-----------|--------|----------|
| Project card clicks open the approved public destination directly in the inbuilt browser instead of showing `ProjectDetail`. | passed | `src/app/portfolio/page.tsx` card `onOpen` uses `getProjectBrowserTarget` and sets `IframeViewer`; no `ProjectDetail` import/render remains. |
| Natural aliases such as FSB, Full Self Browsing, GitFly, Review Gate, T2S, and Parz-AI resolve to canonical project records. | passed | `src/data/projects.ts` adds aliases and `resolveProject`. |
| Project openings prefer correct public targets. | passed | `getProjectBrowserTarget` honors `preferredTarget`, then Website, Design, GitHub; GitFly prefers Website. |
| Unknown, blocked, or unembeddable targets do not create broken browser views. | passed | Unknown aliases do not open; existing `IframeViewer` handles GitHub/unembeddable fallback states. |
| Project/link opens resolve through approved local records or allowlisted URLs, not arbitrary model-generated destinations. | passed | `isApprovedProjectUrl` checks local project `links`; chat tool copy forbids invented project URLs. |

## Human Verification

No manual verification is required for this phase. Visual browser behavior can be spot-checked locally by opening Portfolio and clicking FSB, GitFly, Review Gate, T2S CLI, and Parz-AI.

## Notes

- A user-visible fallback for unknown project tool calls from pages outside Portfolio is intentionally deferred to Phase 18.
