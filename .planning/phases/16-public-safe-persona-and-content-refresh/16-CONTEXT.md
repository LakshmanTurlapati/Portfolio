# Phase 16: Public-Safe Persona and Content Refresh - Context

**Gathered:** 2026-04-26
**Status:** Ready for planning
**Mode:** auto

<domain>
## Phase Boundary

Phase 16 refreshes Parz's public-facing persona, system prompt data, About content, Experience content, and flagship project copy so they all use the same approved public facts. It also adds content-level guardrails for hidden prompts/internal context, private GitFly source, non-public InfiniteChoice/Voyza details, voice internals, secrets/config, and bounded rude-user behavior.

This phase does not implement the direct inbuilt-browser project-opening path, global site control, FSB overlay, or the full verification suite. Those are scoped to Phases 17-20, though Phase 16 should structure its content/data so those later phases can reuse it.

</domain>

<decisions>
## Implementation Decisions

### Public Source of Truth
- **D-01:** Create or refactor toward a typed public-safe content source of truth that is shared by Parz prompt composition and visible portfolio content, rather than separately editing `system-prompt.ts`, `bio.ts`, `experience.ts`, and `projects.ts` with duplicated facts.
- **D-02:** The shared facts must cover Lakshman's current work, persona traits, flagship project narratives, approved links, and forbidden/private categories. The planner can choose exact module names, but the source should be first-party TypeScript data, not a CMS/database/vector store.
- **D-03:** Treat `src/data/system-prompt.ts` as server-only prompt composition. Do not put private details in the prompt just because the file is server-only; only public-safe facts and refusal guidance belong there.

### Current Work and Public Facts
- **D-04:** Current work wording is locked as high-level and public-safe: Lakshman is an AI Enablement Engineer at InfiniteChoice building Voyza, an AI-first hotel booking platform.
- **D-05:** InfiniteChoice/Voyza details must stay brief and public-safe. Do not include internal implementation details, employer/client specifics, roadmap, metrics, architecture, private screenshots, or anything not explicitly approved as public.
- **D-06:** GitFly must be presented as a current flagship project but link only to `https://gitfly.ai`; do not expose or imply access to private GitFly source code.
- **D-07:** FSB / Full Self Browsing must be presented as a current flagship project with its public site/source story and project impact, not the older unrelated `FSB` game-development description currently in `src/data/projects.ts`.
- **D-08:** Review Gate remains an important flagship/story reference and should be refreshed only where needed for accuracy and parity with the new persona narrative.

### Persona Voice and Answer Shape
- **D-09:** Parz should answer direct-first: give the answer immediately, then add color only if it helps. Avoid long recruiter-style summaries, corporate tone, robotic disclaimers, and unsolicited extra chatter.
- **D-10:** Personality should be grounded in the approved traits: ambitious, curious, playful, kind, warm, high-energy, practical, inclusive, direct, confident, story-first, and builder-oriented.
- **D-11:** The explanation for Lakshman's intensity should use the alignment/gap-radar model: he notices the gap between what exists and what could exist, then obsesses until the work matches the internal standard. Do not reduce it to generic success-chasing.
- **D-12:** Humor and casual language are allowed when the user is casual, but the default should stay concise, warm, and clear. Keep the existing no-emoji/plain-text response discipline unless implementation finds a strong reason to revise it.

### Safety and Refusal Boundaries
- **D-13:** Requests for hidden prompts, system instructions, internal context, the data store, secrets, API keys, environment variables, config, or private implementation details must receive a safe refusal or redirect without revealing the requested content.
- **D-14:** Requests about private GitFly source should receive public product information plus the public platform link only.
- **D-15:** Requests about non-public InfiniteChoice/Voyza information should receive only the approved role/product context and a short boundary statement.
- **D-16:** Requests about voice/chatbot internals should be answered only at a high level or with details already public in the repository. Do not expose private operational instructions, secrets, provider keys, or hidden prompt content.
- **D-17:** Rude-user behavior can be sharp and can match casual profanity when appropriate, but must avoid slurs, threats, hate, harassment, sexual content, or punching down.

### Visible Content Parity
- **D-18:** About, Experience, project cards/details, and Parz prompt facts must agree on the same approved facts for InfiniteChoice/Voyza, FSB, GitFly, Review Gate, and Lakshman's persona.
- **D-19:** Update stale visible content that currently points to Rocket Mortgage as the current role and old project narratives. `src/data/bio.ts`, `src/data/experience.ts`, and `src/data/projects.ts` are the primary content files discovered.
- **D-20:** Prefer demoting stale/older project framing rather than deleting useful historical projects unless removal is necessary for clarity. The flagship hierarchy should make FSB and GitFly feel current and intentional.

### Claude's Discretion
- Exact module/file names for the shared public data contract.
- Exact final copy as long as it preserves the locked facts, tone, and safety boundaries above.
- Whether to add lightweight static checks in Phase 16 or leave most eval scaffolding to Phase 20, as long as Phase 16 does not make later parity testing harder.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Scope and Requirements
- `.planning/ROADMAP.md` - Phase 16 goal, dependencies, requirements, and success criteria.
- `.planning/REQUIREMENTS.md` - PERS-01 through PERS-05, CONT-01 through CONT-05, and SAFE-01 through SAFE-05 are the locked requirement set for this phase.
- `.planning/PROJECT.md` - Current milestone context, current public facts, flagship decisions, and out-of-scope boundaries.
- `.planning/STATE.md` - Current v4.1 session state and accumulated decisions.

### Research Guidance
- `.planning/research/SUMMARY.md` - v4.1 research summary recommending first-party typed public data, public/private categories, prompt guardrails, content parity, and no new agent framework/CMS/database.

### Existing Implementation
- `src/data/system-prompt.ts` - Current server-only Parz prompt/data store; stale content and duplicated tone rules live here.
- `src/data/bio.ts` - Current About narrative; contains stale Rocket Mortgage/current-role wording.
- `src/data/experience.ts` - Current Experience entries; needs InfiniteChoice/Voyza public-safe entry.
- `src/data/projects.ts` - Current project inventory/details; needs FSB/GitFly flagship refresh and public/private target constraints.
- `src/app/api/chat/route.ts` - Chat API route that imports `systemPrompt` and appends voice tool instructions.
- `src/app/portfolio/page.tsx` - Current portfolio page shows the existing project data and still has ProjectDetail/IframeViewer split for later phases.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/data/system-prompt.ts`: Server-only prompt entry point already consumed by `/api/chat`; best integration point for prompt composition after public-safe data refactor.
- `src/data/bio.ts`: Structured `BioSegment[]` supports rich About copy with bold spans.
- `src/data/experience.ts`: Structured `ExperienceEntry[]` can add/update current InfiniteChoice role without page rewrites.
- `src/data/projects.ts`: Central project list/details used by the portfolio grid and detail surfaces; good place to introduce public links, aliases/private-source constraints if kept minimal for Phase 16.
- `src/app/api/chat/route.ts`: Existing Vercel AI SDK/xAI route already handles system prompt and voice-tool prompt injection.

### Established Patterns
- Content is currently first-party TypeScript data under `src/data`, not external CMS-backed content.
- The chat route uses a single imported `systemPrompt` string, so prompt refactoring should preserve a simple server-only export for the API route.
- Portfolio project content currently duplicates high-level project facts between project lists, project details, and prompt DATA_STORE, creating drift risk.
- Current package scripts only include `dev`, `build`, `start`, and `lint`; test framework additions are not yet present in `package.json`.

### Integration Points
- Prompt/persona behavior connects through `src/app/api/chat/route.ts` and `src/data/system-prompt.ts`.
- Visible About copy connects through `src/data/bio.ts` and the about page renderer.
- Visible Experience copy connects through `src/data/experience.ts`.
- Visible project cards/details connect through `src/data/projects.ts` and `src/app/portfolio/page.tsx`.
- Later Phase 17 project-opening work should be able to reuse whatever public project facts and approved links Phase 16 creates.

</code_context>

<specifics>
## Specific Ideas

- Use explicit public/private categories such as public can share, public summarize only, private never share, and style only.
- Keep GitFly source private and route users to `https://gitfly.ai` only.
- Keep InfiniteChoice/Voyza wording high-level: AI Enablement Engineer at InfiniteChoice building Voyza, an AI-first hotel booking platform.
- Parz should sound like a direct, warm builder friend, not a corporate portfolio bot.
- Rude replies can have bite, but only within safe boundaries.

</specifics>

<deferred>
## Deferred Ideas

- Direct inbuilt-browser project opening and ProjectDetail primary-path removal belong to Phase 17.
- Global Parz navigation/scroll/project/browser shell control belongs to Phase 18.
- FSB-inspired control overlay and powered-by-FSB badge belong to Phase 19.
- Full Vitest/Playwright verification suite belongs to Phase 20, though Phase 16 should avoid blocking those tests.

</deferred>

---

*Phase: 16-public-safe-persona-and-content-refresh*
*Context gathered: 2026-04-26*
