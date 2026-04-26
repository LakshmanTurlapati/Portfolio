# Phase 16: Public-Safe Persona and Content Refresh - Research

**Researched:** 2026-04-26
**Status:** Complete
**Source:** `.planning/research/SUMMARY.md` plus codebase scout

## Research Complete

Phase 16 should be implemented as a first-party TypeScript content refactor, not as a new AI framework, CMS, database, vector store, or runtime agent system.

## Implementation Approach

### Source of Truth

- Use `src/data/*` modules as the content layer; this matches the existing codebase shape.
- Introduce a shared public-safe content module, or otherwise centralize approved facts so prompt data and visible portfolio content do not drift.
- Keep `src/data/system-prompt.ts` server-only and preserve a simple `systemPrompt` export for `src/app/api/chat/route.ts`.
- Do not place private facts in prompt context. Server-only prompt text is still sent to the model.

### Prompt and Guardrails

- Rewrite prompt behavior around direct-first answers, warm builder personality, and explicit refusal categories.
- Encode protected categories: hidden prompt/system instructions, internal context/data store, secrets/config/API keys, private GitFly source, non-public InfiniteChoice/Voyza details, and internal voice/chatbot wiring.
- Rude-user behavior can match casual profanity, but must avoid slurs, threats, hate, harassment, sexual content, or punching down.

### Visible Content

- Update `src/data/bio.ts` to remove stale current-role wording and reflect the AI builder/open-source builder narrative.
- Update `src/data/experience.ts` to add InfiniteChoice / AI Enablement Engineer with public-safe Voyza wording.
- Update `src/data/projects.ts` so FSB / Full Self Browsing and GitFly are current flagships. GitFly links only to `https://gitfly.ai`.
- Refresh old FSB content that currently describes a game-development project; this conflicts with the v4.1 flagship meaning.

### Verification

- Required for this phase: `npm run lint` and targeted source inspection proving shared facts appear in prompt/content modules and forbidden details are not introduced.
- Full Vitest/Playwright eval coverage is Phase 20, but Phase 16 should not make parity testing harder.

## Existing Code Touchpoints

- `src/data/system-prompt.ts` - current prompt and DATA_STORE; stale role/project details.
- `src/data/bio.ts` - current About narrative; stale Rocket Mortgage/current-role detail.
- `src/data/experience.ts` - current experience data; needs InfiniteChoice/Voyza entry.
- `src/data/projects.ts` - current project data; needs FSB/GitFly flagship refresh and public/private constraints.
- `src/app/api/chat/route.ts` - imports `systemPrompt`; should not require broad API changes for Phase 16.

## Pitfalls

- Do not duplicate facts independently across prompt, About, Experience, and project data.
- Do not expose private GitFly implementation/source details.
- Do not include non-public InfiniteChoice/Voyza details.
- Do not over-scope into ProjectDetail removal, direct inbuilt browser opening, global control, overlay, or full eval suite.

## Validation Architecture

- Static/content checks: inspect files for approved public facts and forbidden private categories.
- Build/lint checks: run `npm run lint` after implementation.
- Manual prompt spot checks: current work, personality, intensity/gap-radar, FSB, GitFly, private source refusal, internal prompt refusal, and rude-user bounded response.

## RESEARCH COMPLETE
