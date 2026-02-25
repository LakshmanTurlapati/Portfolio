# Phase 5: Portfolio Page and Data - Context

**Gathered:** 2026-04-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver a fully polished v3 portfolio page: DataGrid canvas background with proximity/hover effects, per-project signature animations, slide-in project detail overlay with rich content, IframeViewer for embedding external links, and GitHub repo preview with rendered README. This phase is **validate/polish** — most components already exist from a prior implementation session and need auditing, bug fixes, and pixel-perfect alignment with the v3 design prototype.

</domain>

<decisions>
## Implementation Decisions

### Visual Polish
- **D-01:** Cards must be **pixel-perfect** match to the v3 prototype — rounded corners, 8px padding, image insets, hover background transitions, card name text-shadow, link icon opacity.
- **D-02:** Grid layout is confirmed: 4 columns desktop, 3 at 1400px, 2 at 1020px, 1 on mobile. No changes needed.

### GitHub Preview
- **D-03:** **Full GitHub repo preview** — fetch repo metadata, rendered README (via GitHub markdown API), contributors avatars, languages bar. Matches the v3 prototype's `GithubPreview` component exactly. Uses unauthenticated GitHub API (60 req/hr rate limit is acceptable for a portfolio).

### Detail Overlay Content
- **D-04:** **Fill all 21 projects** with detail writeups. Currently 13 have rich content — generate content for the remaining 8 (Heartline, Lucent, awsxUTD-Hackathon, awsxutd, Open-API, ArtScii, FSB, ProKeys) based on their GitHub repos and existing project data.

### Snowfall
- **D-05:** **DataGrid only** on the portfolio page. Snowfall component stays in codebase but is NOT rendered on portfolio page. No combined effect.

### Claude's Discretion
- Exact animation durations and easing curves for card hover transitions
- DataGrid default config values (cell size, spacing, opacity ranges)
- Error handling for GitHub API rate limits in repo preview

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### V3 Design Prototype (primary reference)
- `/tmp/design-extract/portfolio-v3/project/portfolio_page.jsx` — Full portfolio page with DataGrid, cards, detail overlay, IframeViewer, GithubPreview
- `/tmp/design-extract/portfolio-v3/project/project_details.jsx` — All project detail writeups
- `/tmp/design-extract/portfolio-v3/project/projects.jsx` — Project data with 21 projects
- `/tmp/design-extract/portfolio-v3/project/styles.css` — All CSS styles for portfolio page components

### Existing Implementation (audit targets)
- `src/components/data-grid.tsx` — DataGrid canvas with hover effects (already implemented)
- `src/components/project-detail.tsx` — Project detail overlay (already implemented)
- `src/components/iframe-viewer.tsx` — Embed modal (already implemented)
- `src/components/portfolio-card.tsx` — Card with hover triggers (already implemented)
- `src/app/portfolio/page.tsx` — Portfolio page assembly (already implemented)
- `src/data/projects.ts` — Project data, details, effects mapping (already implemented)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/data-grid.tsx` — Full DataGrid with all 10 hover effects, proximity reveal, mouse glow. Needs audit against prototype.
- `src/components/project-detail.tsx` — Slide-in overlay with metadata display. Needs pixel-perfect CSS audit.
- `src/components/iframe-viewer.tsx` — Embed modal with Figma/YouTube/web detection. Needs GithubPreview component added.
- `src/components/portfolio-card.tsx` — Card with DataGrid hover trigger. Needs visual polish.
- `src/data/projects.ts` — 21 projects, PROJECT_DETAILS (13 filled), PROJECT_EFFECTS mapping.

### Established Patterns
- Canvas rendering uses `useRef` + `requestAnimationFrame` loop (see data-grid.tsx, particle-background.tsx)
- Theme detection via `useTheme()` from next-themes + `useMounted()` guard
- CSS custom properties for theme colors (globals.css `:root` and `.dark`)
- react-icons for Font Awesome icons (FaLink, FaCodeFork, FaFigma, FaGithub, etc.)

### Integration Points
- Portfolio page is at `src/app/portfolio/page.tsx` (App Router)
- Navigation from home uses `TransitionProvider.navigateWithReveal()`
- Back button uses same reveal transition to return to `/`

</code_context>

<specifics>
## Specific Ideas

- The v3 prototype's GithubPreview component renders full README HTML via GitHub's markdown API, shows contributors as avatars, displays language bar with grayscale color segments, and includes a mock GitHub-style header with Watch/Fork/Star buttons.
- Project detail overlay uses serif font for titles (the prototype uses 'Instrument Serif') — in the Next.js version, adapt to available fonts or add the font.
- DataGrid controls panel uses JetBrains Mono font for the monospace UI — consider loading or falling back to system monospace.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 05-portfolio-page-and-data*
*Context gathered: 2026-04-23*
