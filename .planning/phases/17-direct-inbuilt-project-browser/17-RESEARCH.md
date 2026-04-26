# Phase 17: Direct Inbuilt Project Browser - Research

**Researched:** 2026-04-26
**Status:** Complete

## Summary

Phase 17 can be implemented with small targeted changes. The existing portfolio page already has an `IframeViewer` path for manual card opens, but voice/tool opening still selects `ProjectDetail`. The project data file is the right place to add aliases, target preference metadata, URL allowlisting, and a resolver reusable by Phase 18.

## Relevant Files

- `src/data/projects.ts` contains `Project`, `pinnedProjects`, `shuffleableProjects`, `PROJECT_DETAILS`, and `PROJECT_EFFECTS`.
- `src/app/portfolio/page.tsx` renders cards, imports `ProjectDetail`, opens `IframeViewer` for manual card clicks, and registers an `openProject` voice callback that currently selects `ProjectDetail`.
- `src/components/iframe-viewer.tsx` already detects GitHub/Figma/web targets and handles unembeddable hosts with preview or fallback UI.
- `src/app/api/chat/route.ts` has `openProject` tool wording that says to navigate to portfolio first and open a detail view.
- `src/lib/voice-commands.ts` uses `openProject` in tour steps with `{ slug: 'Parz-AI' }`.

## Implementation Approach

- Extend `Project` with optional `aliases` and `preferredTarget` metadata.
- Add exported helpers in `src/data/projects.ts`:
  - combine all projects in canonical order
  - normalize names and aliases
  - resolve alias/slug/name to a canonical project
  - select an approved browser target with Website > Design > GitHub unless overridden
  - guard targets with an allowlist derived from project records
- Update `src/app/portfolio/page.tsx` to use the resolver/target helper for manual clicks and voice callback opening.
- Remove `ProjectDetail` from portfolio rendering/imports so the primary path no longer appears.
- Keep `IframeViewer` visuals unchanged, relying on its existing GitHub/unembeddable fallback behavior.
- Update `src/app/api/chat/route.ts` tool descriptions to reference approved browser targets rather than arbitrary detail views.

## Risks

- If the resolver is too permissive, model-generated URLs could bypass SAFE-06. Keep URL validation tied to approved project records.
- If aliases are not broad enough, natural names like `FSB`, `Full Self Browsing`, `GitFly`, `Review Gate`, `T2S`, and `Parz-AI` may fail.
- If selected project state remains in portfolio, the removed right-side panel could still appear through voice/tour paths.

## Verification

- Run `npm run lint`.
- Confirm `src/app/portfolio/page.tsx` no longer imports or renders `ProjectDetail`.
- Confirm card and voice open paths both set `IframeViewer` state.
- Confirm GitFly resolves only to `https://gitfly.ai`.
- Confirm unknown aliases do not open arbitrary URLs.

## Completion Marker

## RESEARCH COMPLETE
