# Phase 20: Verification and Regression Coverage - Context

**Gathered:** 2026-04-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 20 adds repeatable local verification for the v4.1 persona, public content parity, guardrails, project/tool resolution, and Parz site-control/browser-overlay behavior. It should prove EVAL-01 through EVAL-05 with deterministic Vitest tests and focused Playwright E2E coverage before milestone completion.

This phase should not redesign UI, expand Parz capabilities, introduce live API dependency into tests, expose private details, or revisit completed Phase 16-19 behavior except for minimal testability fixes or concrete regression fixes found while adding coverage.

</domain>

<decisions>
## Implementation Decisions

### Test Scope And Runner Setup
- Add both Vitest and Playwright now because EVAL-01 through EVAL-04 require repeatable unit/eval coverage and EVAL-05 explicitly requires Playwright E2E.
- Structure prompt/persona evals as deterministic local assertions against exported prompt/data and small fixture contracts where possible, avoiding live Grok calls in tests.
- Keep Playwright coverage focused on one happy-path E2E flow: open chat, trigger Parz control behavior, navigate/scroll/open project, and assert browser shell plus FSB overlay/badge behavior.
- Change production behavior only for minimal testability exports/selectors where necessary; avoid user-visible behavior changes unless a regression is found.

### Eval Assertions And Safety Thresholds
- Persona evals should assert canonical public-profile facts, direct-first tone rules, current-work answer, flagship project framing, and alignment/gap-radar explanation are present in prompt/data contracts.
- Guardrail evals should assert protected categories are named in the prompt/data contract and unsafe requests map to refusal/redirect guidance without exposing internal details.
- Source parity tests should verify shared public facts appear consistently across `public-profile`, About bio, Experience, Projects, and system prompt composition.
- Prefer semantic substring/contract assertions over brittle full-text snapshots, with exact checks only for locked URLs, role/company/product, project names, and `powered by FSB`.

### Project Resolution And Browser Control Coverage
- Cover required aliases from the roadmap: FSB, Full Self Browsing, GitFly, Review Gate, T2S, and Parz-AI, plus at least one unknown-project fallback.
- Prove approved project targets resolve exactly to local project URLs, GitFly resolves only to `https://gitfly.ai`, and unknown/model-invented targets do not open.
- Unit-test close browser/no-browser, open current project external/no-browser, unsupported iframe control response, and page/section normalization where exposed.
- Assert overlay state appears during site-control actions via E2E and exact badge copy `powered by FSB`; avoid timing-fragile animation assertions.

### Verification Commands And Developer Workflow
- Add `test`, `test:watch`, and `test:e2e` scripts while keeping `lint` unchanged.
- Do not add Playwright postinstall side effects; document/use `npx playwright install` when needed and let `test:e2e` fail clearly if browsers are missing.
- Tests should be deterministic, local, and not require `XAI_API_KEY`, ElevenLabs keys, or reachable production URLs.
- Phase completion requires `npm test` passing for Vitest coverage, `npm run lint` passing, and Playwright spec existing with a clear local run command; run E2E if browser install is available.

### Claude's Discretion
- Exact test file names, fixture structure, and assertion helper boundaries.
- Exact Playwright selectors as long as they remain stable and do not harm the user-facing UI.
- Whether to add small pure helper exports for site-control normalization/resolution if needed for reliable tests.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/data/public-profile.ts` centralizes current public-safe facts, guardrails, persona traits, current work, flagship projects, and approved links.
- `src/data/system-prompt.ts` composes the server-side Parz prompt consumed by `/api/chat` and is the core target for persona and guardrail evals.
- `src/data/bio.ts`, `src/data/experience.ts`, and `src/data/projects.ts` are visible-content data sources that should stay aligned with `publicProfile`.
- `src/data/projects.ts` already exports `resolveProject`, `isApprovedProjectUrl`, `getProjectBrowserTarget`, and canonical project metadata for resolver tests.
- `src/providers/site-control-provider.tsx` owns global navigation, project opening, browser shell state, unsupported iframe-control handling, and FSB overlay lifecycle.
- `src/components/fsb-control-overlay.tsx` renders the user-visible overlay and exact `powered by FSB` badge introduced in Phase 19.

### Established Patterns
- The codebase is now Next.js 15, React 19, TypeScript, Tailwind CSS 4, and App Router based.
- There is currently no test framework in `package.json`; scripts are `dev`, `build`, `start`, and `lint`.
- Content and behavior contracts are first-party TypeScript data/functions rather than CMS, database, or live model eval infrastructure.
- v4.1 decisions prefer deterministic local guardrails and approved local project/link data over arbitrary model-generated URLs.

### Integration Points
- Add Vitest configuration and tests under a conventional tests location that can import `src` modules with the existing `@/` alias if configured.
- Add Playwright configuration and E2E specs for the user-visible Parz control flow without requiring production APIs or secrets.
- Use minimal stable selectors or accessible labels in chat/control/browser surfaces only where current markup does not provide reliable test handles.
- Keep GSD verification aligned with ROADMAP success criteria and update Phase 20 artifacts after test execution.

</code_context>

<specifics>
## Specific Ideas

- Required alias coverage: FSB, Full Self Browsing, GitFly, Review Gate, T2S, Parz-AI, plus unknown fallback.
- Locked exact values include `AI Enablement Engineer`, `InfiniteChoice`, `Voyza`, `https://gitfly.ai`, `https://www.full-selfbrowsing.com`, and `powered by FSB`.
- Tests must not require live Grok, ElevenLabs, Amplify, or custom-domain availability.
- The Playwright suite should be focused and practical rather than screenshot-diff heavy.

</specifics>

<deferred>
## Deferred Ideas

- Live Amplify/custom-domain API smoke testing remains deferred to API-03 once a reachable production URL is available.
- Optional overlay captions and dedicated mobile overlay visual treatment remain future FSB-04/FSB-05 polish.
- Broader cross-browser or screenshot-diff visual regression coverage can be considered after this milestone.

</deferred>
