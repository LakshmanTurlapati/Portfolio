# Phase 20: Verification and Regression Coverage - Research

## Research Complete

Phase 20 should use deterministic local tests because the milestone requirements are about proving already-built v4.1 contracts, not validating live model/provider behavior.

## Relevant Existing Implementation

- `src/data/public-profile.ts` is the canonical public-safe source for current work, persona traits, flagship projects, guardrails, and approved links.
- `src/data/system-prompt.ts` composes the server-side Parz prompt from `publicProfile`, making it suitable for local prompt contract assertions.
- `src/data/bio.ts`, `src/data/experience.ts`, and `src/data/projects.ts` are visible content sources that can be checked for parity with `publicProfile`.
- `src/data/projects.ts` exports `resolveProject`, `isApprovedProjectUrl`, and `getProjectBrowserTarget`, which can be covered directly with Vitest.
- `src/providers/site-control-provider.tsx` owns global shell actions, project browser state, and FSB overlay lifecycle.
- `src/components/fsb-control-overlay.tsx` renders exact `powered by FSB` badge copy and a live-region status.

## Testing Approach

- Add Vitest for fast local contract tests. Use TypeScript tests and the existing `@/` import convention via Vite/Vitest alias config.
- Add Playwright for one focused E2E spec. Avoid API calls by exposing a development/test-only browser hook from `SiteControlProvider`, then calling shell actions directly from the page context.
- Keep tests local and deterministic. Do not require `XAI_API_KEY`, ElevenLabs keys, production domains, or model calls.
- Prefer substring and contract assertions over brittle full snapshots. Use exact checks only for locked public facts, URLs, aliases, and badge copy.

## Plan Shape

1. Configure Vitest and Playwright scripts/dependencies.
2. Add focused Vitest suites for prompt/persona/guardrail coverage, source parity, and project resolver behavior.
3. Add minimal testability exports/hooks for site-control E2E without changing production behavior.
4. Add Playwright coverage for navigation, section scroll, project opening, and overlay/badge visibility.
5. Run `npm test`, `npm run lint`, and `npm run test:e2e` when browsers are available.

## Risks

- Playwright browser binaries may not be installed locally. The implementation should not add postinstall side effects; document/use `npx playwright install` when needed.
- Directly testing model responses would be flaky and secret-dependent, so this phase should validate prompt/data/tool contracts rather than live Grok output.
