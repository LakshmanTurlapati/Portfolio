# Phase 11: IframeViewer Browser Previews - Context

**Gathered:** 2026-04-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix the project card click behavior to match the v3 prototype: clicking a project card opens the IframeViewer directly (not a side panel). The prototype picks the best embeddable link (Website > Design > GitHub) and opens the IframeViewer immediately. The current ProjectDetail side panel is NOT the intended UX.

</domain>

<decisions>
## Implementation Decisions

### Card Click Behavior
- **D-01:** Clicking a project card opens the **IframeViewer directly** — NOT the ProjectDetail side panel. This matches the v3 prototype's `openProject` function (portfolio_page.jsx lines 585-600).
- **D-02:** Link priority for IframeViewer: (1) Website if embeddable, (2) Design link, (3) Website even if unembeddable, (4) GitHub. Fallback to GitHub preview if nothing else is available.
- **D-03:** The ProjectDetail side panel component may be kept for a secondary interaction (e.g., long-press or info button) but is NOT the primary click action.

### IframeViewer Component
- **D-04:** The IframeViewer component (`src/components/iframe-viewer.tsx`) is already built and functional. It handles Figma embed, YouTube embed, GitHub preview, unembeddable fallback CTA, loading states, and chrome bar. No changes needed to the component itself.

### Claude's Discretion
- Whether to remove ProjectDetail entirely or repurpose it
- Whether to add a secondary way to access project details (info icon, long-press, etc.)
- Any visual polish to the IframeViewer chrome bar

</decisions>

<canonical_refs>
## Canonical References

### V3 Prototype (ground truth)
- `/tmp/design-extract/portfolio-v3/project/portfolio_page.jsx` lines 585-600 — `openProject` directly opens IframeViewer

### Current Implementation
- `src/app/portfolio/page.tsx` — Portfolio page with openProject → ProjectDetail (needs to change to → IframeViewer)
- `src/components/iframe-viewer.tsx` — IframeViewer component (already built)
- `src/components/project-detail.tsx` — ProjectDetail side panel (currently primary, should become secondary)

</canonical_refs>

<code_context>
## Existing Code Insights

### What Needs to Change
- `src/app/portfolio/page.tsx`: The `openProject` callback currently sets `selectedProject` state to open ProjectDetail. Change it to pick the best link and set `viewer` state to open IframeViewer directly (same logic as prototype lines 585-600).

### What's Already Done
- IframeViewer component is complete
- `viewer` state and `openInViewer` function already exist in portfolio/page.tsx
- `isUnembeddable` and `detectKind` utilities already exist in iframe-viewer.tsx

</code_context>

<specifics>
## Specific Ideas

The fix is essentially changing `openProject` from:
```ts
setSelectedProject(project);  // opens side panel
```
to:
```ts
// Pick best embeddable link, open IframeViewer directly
const links = project.links || {};
let url, label;
if (links.Website && !isUnembeddable(links.Website)) { url = links.Website; label = 'Visit site'; }
else if (links.Design) { url = links.Design; label = 'Design'; }
else if (links.Website) { url = links.Website; label = 'Visit site'; }
else if (links.GitHub) { url = links.GitHub; label = 'Source'; }
if (url) setViewer({ url, label });
```

</specifics>

<deferred>
## Deferred Ideas

- Repurposing ProjectDetail as a secondary info view (long-press, info button)

</deferred>

---

*Phase: 11-iframeviewer-browser-previews*
*Context gathered: 2026-04-24*
