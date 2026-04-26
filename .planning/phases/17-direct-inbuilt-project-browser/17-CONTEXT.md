# Phase 17: Direct Inbuilt Project Browser - Context

**Gathered:** 2026-04-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 17 replaces the current right-side project detail detour with one approved inbuilt-browser project-opening path. Project cards and project-opening tools should resolve canonical project records, natural aliases, and approved targets before opening anything, with safe fallbacks for unknown, blocked, or unembeddable destinations.

This phase should not implement full global Parz site control, precise cross-page scrolling, browser shell actions, or the FSB-inspired control overlay. Those belong to Phases 18 and 19. Phase 17 should structure project resolution so those later phases can reuse it.

</domain>

<decisions>
## Implementation Decisions

### Project Resolution And Safety
- Canonical project aliases should live with the project records, preferably in or near `src/data/projects.ts`, so the portfolio UI, Parz tools, and future tests share one source of truth.
- Project/link opening must be strict: only approved local project targets and allowlisted URLs should open. Unknown or model-generated destinations must not be opened.
- GitFly opens only `https://gitfly.ai`; do not expose, infer, or route to private source-code targets.
- Unknown aliases should produce a clean project-not-found or target-unavailable fallback instead of silently doing nothing, navigating arbitrarily, or opening arbitrary links.

### Portfolio Click Behavior
- Project cards should open the inbuilt `IframeViewer` directly using each project's preferred public target.
- Remove `ProjectDetail` from the primary portfolio path. Delete the component only if no remaining imports depend on it; otherwise leave cleanup to a safe follow-up.
- Reuse existing `IframeViewer` and `isUnembeddable` fallback behavior for blocked or unembeddable hosts, including an external-open CTA where appropriate.
- Do not redesign the portfolio grid/card UI in this phase. Preserve visual layout and change only the opening behavior needed for the direct browser path.

### Parz/Voice Project Opening Bridge
- Build the canonical resolver now, but keep full any-page Parz site control in Phase 18. Phase 17 should make portfolio-page project opening and local tool resolution direct and safe.
- The current portfolio `openProject` callback should resolve alias, slug, or name to a canonical project, then open that project's browser target directly rather than selecting the detail panel.
- Update prompt/tool guidance only where needed to avoid contradicting Phase 17 behavior, especially instructions that say Parz must navigate to portfolio first before opening a project.
- Add focused resolver/unit coverage if an existing test harness is available; otherwise keep the resolver small and testable so Phase 20 can add the full eval and E2E suite.

### Claude's Discretion
- Exact resolver function names and file boundaries.
- Exact fallback copy, as long as it is clear and public-safe.
- Whether to delete or leave unused `ProjectDetail` code after confirming imports.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/data/projects.ts` contains the central project records and project detail data, including Phase 16 public-safe flagship updates for FSB, GitFly, Review Gate, and related projects.
- `src/app/portfolio/page.tsx` currently imports `ProjectDetail`, `IframeViewer`, `isUnembeddable`, and project data. Manual card clicks already call a local `openProject(project)` that opens an iframe URL, but voice callback wiring still selects a project for `ProjectDetail`.
- `src/components/iframe-viewer.tsx` already provides the inbuilt browser surface and fallback behavior for URLs that cannot be embedded.
- `src/lib/voice-controller.ts`, `src/lib/voice-commands.ts`, and `src/app/api/chat/route.ts` contain existing `openProject` tool/callback guidance that may need minimal alignment.

### Established Patterns
- Current project content and public-safe facts are first-party TypeScript data under `src/data`.
- Portfolio state is local React state in `src/app/portfolio/page.tsx`, with selected project/detail state and iframe viewer state.
- Existing code prefers reusing the inbuilt browser rather than adding new browser surfaces.
- The milestone intentionally separates Phase 17 browser path changes from Phase 18 global site control and Phase 19 visual overlay.

### Integration Points
- `src/data/projects.ts` is the best place to add canonical aliases, preferred targets, allowlist metadata, and resolver helpers if they are project-data-specific.
- `src/app/portfolio/page.tsx` is the primary implementation point for replacing the right-side detail panel path with direct inbuilt-browser opening.
- `src/app/api/chat/route.ts` tool descriptions should not tell Parz to always navigate to portfolio first if Phase 17 enables direct local resolution in the portfolio path.
- Phase 18 can reuse the Phase 17 resolver when wiring project opening from home or any current page.

</code_context>

<specifics>
## Specific Ideas

- Natural aliases should include FSB, Full Self Browsing, GitFly, Review Gate, T2S, and Parz-AI.
- Public project targets should prefer public GitHub for open-source projects and public websites for products such as GitFly.
- GitFly must link only to `https://gitfly.ai`.
- Preserve the existing visual design; the main UX change is direct inbuilt-browser opening instead of the side detail panel.

</specifics>

<deferred>
## Deferred Ideas

- Global Parz project opening from any page, including home without navigating to portfolio first, belongs to Phase 18.
- Precise navigation, section scrolling, and browser shell actions belong to Phase 18.
- FSB-inspired monochrome control overlay and powered-by-FSB badge belong to Phase 19.
- Full prompt eval, resolver test, and Playwright regression suite belongs to Phase 20 unless a focused existing test harness is already available.

</deferred>
