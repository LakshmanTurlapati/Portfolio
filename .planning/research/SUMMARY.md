# Project Research Summary

**Project:** Portfolio V3 — v4.1 Parz Persona, Portfolio Context, and Site Control Refresh  
**Domain:** Next.js AI portfolio agent with public-safe persona refresh, global site control, inbuilt project browser, and prompt/eval guardrails  
**Researched:** 2026-04-25 / 2026-04-26  
**Confidence:** HIGH overall; MEDIUM for final persona wording and eval thresholds until copy is approved and first eval pass is tuned.

## Executive Summary

v4.1 is not a platform rewrite. It is a focused refresh of Parz’s public-facing brain, project context, and visible control surface on top of the existing Next.js App Router, React, TypeScript, Tailwind, AI SDK/xAI, `VoiceSessionProvider`, and `IframeViewer` architecture. Experts would build this as first-party typed data, prompt modules, AI SDK tools, React providers, and local evals — not as a new agent framework, browser automation system, database, CMS, or UI library.

The recommended approach is to first define a public-safe source of truth for Parz, projects, current work, and forbidden/private categories; then update visible portfolio content and prompt behavior; then unify all project opening through the inbuilt browser; then add global Parz site-control actions; then layer the FSB-inspired monochrome overlay on top of real tool lifecycle state. `Vitest` is the only required stack addition so prompt/data/tool behavior can be regression-tested. Playwright is optional only if roadmap wants automated browser-level verification.

The main risks are privacy leakage, source-of-truth drift, and overpromising browser control. Server-only prompt text is still sent to the model, so private details must not be placed there. Project opening must resolve from trusted local data, not arbitrary model-supplied URLs. Parz can control the portfolio shell — route changes, section scrolls, viewer open/close/external-open — but cannot reliably click or read arbitrary cross-origin iframes.

## Key Findings

### Recommended Stack

**Stack additions:**
- `vitest` — required for deterministic prompt/data/guardrail/tool-selection evals and local CI-friendly regression coverage.
- `@playwright/test` — optional, only for E2E proof that Parz opens projects, navigates, scrolls, and displays the overlay in a real browser.
- React Testing Library + jsdom — optional alternative for component-level tests if Playwright is deferred; do not add both UI test stacks unless needed.

**Stack non-additions:**
- No LangChain/LlamaIndex/Mastra/MCP runtime; AI SDK tools already fit this scope.
- No production Playwright/Puppeteer/browser automation; project opening is React state around `IframeViewer`.
- No Zustand/Redux/XState; existing provider/callback pattern is enough.
- No database, vector store, CMS, prompt eval SaaS, Framer Motion, Radix, or shadcn.

**Core technologies to keep using:**
- Next.js App Router + React 19 + TypeScript — persistent providers, pages, and typed data/control modules.
- Vercel AI SDK v6 + `@ai-sdk/xai` + Zod — typed tool schemas, streaming chat, and xAI-backed Parz responses.
- Tailwind CSS 4 + CSS variables + optional existing GSAP — FSB-inspired overlay styling without new UI dependencies.
- `VoiceSessionProvider`, `VoiceBus`, `voice-controller.ts` — current persistent control and tool dispatch foundation.
- `IframeViewer` + `GithubPreview` + unembeddable fallback logic — primary project-opening surface.

### Expected Features

**Must have / table stakes:**
- Direct, current Parz answers with a warm, playful, practical personality — direct answer first, no corporate recruiter-bot tone.
- Public-safe current work context: InfiniteChoice, Voyza, AI Enablement Engineer, high-level only.
- FSB / Full Self Browsing and GitFly as current flagship projects; GitFly links only to `https://gitfly.ai`.
- Content parity across Parz prompt/data, About/Experience, project cards, and project-opening targets.
- Guardrails for system prompt/data store, API keys/env vars, internal voice wiring, private GitFly source, and non-public InfiniteChoice/Voyza details.
- Rude-user behavior that can be witty/direct but never slurs, threats, hate, sexual harassment, or punching down.
- Prompt eval coverage for persona, facts, flagships, refusal behavior, rude-user boundaries, and tool intent.
- Project cards and Parz commands open projects directly in the inbuilt browser, not the right-side `ProjectDetail` panel.
- Parz can open projects from any page, navigate home/portfolio/about, scroll sections, toggle theme, and operate viewer shell controls where feasible.
- FSB-inspired monochrome overlay with bottom-left `powered by FSB` badge during active control actions only.

**Differentiators:**
- A visible “Parz is operating the site” moment via overlay and short action labels.
- Conversational intent opens projects directly from home/current page.
- Persona grounded in Lakshman’s builder psychology, flagship narratives, and current public work.
- Browser-aware fallbacks for blocked/unembeddable targets.
- Tool feedback in Parz’s voice: “Opening GitFly,” “Taking you to Experience,” etc.

**Defer / avoid:**
- General-purpose autonomous browser control inside arbitrary iframes.
- New chat UI redesign or mobile-specific control redesign unless current UI breaks.
- Database-backed memory, auth, deep employer case studies, or private implementation/source disclosures.

### Architecture Approach

The key architectural recommendation is to keep page-local callbacks for page-local actions, but move global actions — especially project opening and browser viewer state — into `VoiceSessionProvider` or a tiny layout-level viewer provider. Manual card clicks and AI-triggered project opens should share one resolver and one viewer path.

**Major components / modules:**
1. `src/data/projects.ts` — public project source of truth; add FSB, GitFly, aliases, browser targets, and private-source constraints.
2. `src/data/system-prompt.ts` plus optional typed public data modules — server-only prompt composition with public/private categories and guardrails.
3. `src/lib/project-targets.ts` — pure resolver for project name/alias plus preferred target selection.
4. Global viewer provider or layout-level viewer host — opens `IframeViewer` from any route.
5. `VoiceSessionProvider` — owns global `openProject`, feasible browser actions, route control, and overlay state.
6. `/api/chat/route.ts` and `voice-controller.ts` — update tool descriptions/dispatch so `openProject` no longer detours through `/portfolio` or `ProjectDetail`.
7. `src/components/parz-control-overlay.tsx` — decorative, pointer-events-safe overlay driven by tool lifecycle.
8. `tests/evals/*` — Vitest fixtures and assertions for prompt, guardrails, tool intent, and target resolution.

### Critical Pitfalls and Guardrails

1. **Server-only prompt ≠ safe-to-leak prompt** — never put private details in model context; categorize `PUBLIC_CAN_SHARE`, `PUBLIC_SUMMARIZE_ONLY`, `PRIVATE_NEVER_SHARE`, and `STYLE_ONLY`.
2. **UI and Parz data drift** — create one public content inventory for project names, aliases, summaries, allowed links, forbidden details, and preferred browser targets.
3. **ProjectDetail removal incomplete** — remove `selectedProject`/`ProjectDetail` render path and replace voice `openProject` with shared browser-target opening.
4. **Overpromising iframe/browser control** — tool descriptions must say Parz controls the portfolio shell, not arbitrary third-party iframe DOM.
5. **Arbitrary URL opening** — `openProject` accepts only names/aliases and resolves canonical local URLs; generic `openLink` should be allowlisted or require confirmation.
6. **Tool success UI lies** — callbacks should return status or promises; overlay should show success/error/blocked only after action result is known.
7. **Happy-path-only evals** — include adversarial privacy extraction, rude-user, URL, unknown project, and tool-intent cases.
8. **Overlay z-index/accessibility collisions** — pointer-events discipline, reduced-motion handling, Escape precedence, and 600px breakpoint testing are required.

## Requirements Categories Suggested

- **Persona and tone requirements:** direct-first answers, warmer builder personality, no corporate tone, no emoji/markdown-heavy output.
- **Public-safe content requirements:** approved InfiniteChoice/Voyza wording, FSB/GitFly flagship hierarchy, older project demotion, About/Experience/project parity.
- **Privacy and refusal requirements:** internal prompt/data, secrets/config, private GitFly source, non-public employer/product details, voice internals.
- **Project browser requirements:** canonical target resolver, aliases, direct `IframeViewer` opening, blocked/unembeddable fallback, no `ProjectDetail` primary path.
- **Site-control requirements:** navigate, scroll, open project, viewer shell controls, theme/link/text/voice handoff, status reporting.
- **Overlay requirements:** monochrome FSB-inspired visual language, bottom-left `powered by FSB`, action captions, transient lifecycle, reduced-motion and layering rules.
- **Eval and verification requirements:** Vitest static checks, optional live xAI evals, guardrail assertions, tool-intent tests, optional Playwright E2E.

## Implications for Roadmap

### Phase 1: Public-Safe Data Contract and Eval Scaffolding
**Rationale:** Safety and source-of-truth decisions must precede prompt/content/tool changes.  
**Delivers:** Approved public/private categories, project inventory, initial Vitest setup, static guardrail fixtures.  
**Addresses:** Public-safe persona/current-work facts, guardrails, parity foundation.  
**Avoids:** Prompt leakage, data drift, happy-path-only evals.  
**Research flag:** Standard patterns; no deeper research needed unless live xAI eval thresholds are debated.

### Phase 2: Persona, Prompt, and Visible Content Refresh
**Rationale:** Parz and visible pages must agree before control features showcase current projects.  
**Delivers:** Refreshed `system-prompt.ts`, updated About/Experience data, FSB/GitFly flagship project entries, public links only.  
**Uses:** Typed TS data modules, server-only prompt composition, Vitest parity checks.  
**Avoids:** GitFly private source exposure, stale FSB/GitFly/Voyza descriptions, verbose/bland persona drift.

### Phase 3: Direct Inbuilt-Browser Project Opening and ProjectDetail Removal
**Rationale:** Establish the intended project UX before Parz controls it.  
**Delivers:** Shared project target resolver, aliases, canonical targets, card clicks opening `IframeViewer`, `ProjectDetail` primary path removed.  
**Addresses:** Direct project opening, no right-side panel, unknown-project behavior.  
**Avoids:** Voice still calling `setSelectedProject`, portfolio detours, brittle exact-name matching.

### Phase 4: Global Parz Site Control and Browser Shell Actions
**Rationale:** Global project opening and route/scroll controls require provider-level ownership rather than page-local callbacks.  
**Delivers:** Global `openProject`, viewer host/provider, route navigation, About scroll from any page, theme/viewer actions, allowlisted link behavior, callback result statuses.  
**Research flag:** Needs careful planning/testing around AI SDK streaming dispatch, async callback statuses, URL allowlisting, and iframe capability boundaries.

### Phase 5: FSB-Inspired Control Overlay
**Rationale:** Overlay should communicate real tool execution after the actions are reliable.  
**Delivers:** Monochrome overlay, action captions, `powered by FSB` badge, success/error/blocked states, reduced-motion support.  
**Avoids:** Silent tool execution, lying success UI, z-index/accessibility collisions.  
**Research flag:** Standard UI work; skip research, but require visual review at desktop/mobile breakpoint.

### Phase 6: Prompt, Tool, and Optional E2E Verification
**Rationale:** v4.1’s subjective persona and safety claims need regression protection before milestone completion.  
**Delivers:** Passing eval suite for persona, current work, flagships, private/internal refusal, rude-user boundaries, tool intent, project target resolution; optional Playwright E2E for navigation/opening/overlay.  
**Research flag:** Add Playwright research only if automated browser proof is required; otherwise manual UI verification plus Vitest is sufficient.

### Phase Ordering Rationale

- Public-safe data comes first because prompt, UI content, project target resolution, and evals all depend on the same approved facts.
- Content/prompt refresh comes before control polish so Parz knows what FSB, GitFly, InfiniteChoice, and Voyza mean publicly.
- Direct project opening comes before global control because global control should reuse a proven browser-opening path.
- Overlay comes after tool behavior because it must reflect real execution status, not decorative optimism.
- Evals start early but harden at the end after prompt/data/tool surfaces stabilize.

### Research Flags

**Likely needs deeper research/planning:**
- Phase 4 — async AI SDK tool dispatch statuses, URL allowlisting policy, route-readiness handling, and iframe-shell capability boundaries.
- Phase 6 — optional Playwright E2E setup if the roadmap chooses automated browser verification.

**Standard patterns / skip research-phase:**
- Phase 1 — Vitest setup and typed data contracts are straightforward.
- Phase 2 — prompt/data/content edits are codebase-specific, not technology-research-heavy.
- Phase 3 — resolver/provider pattern is already specified; implementation needs code review/build verification, not more research.
- Phase 5 — React/Tailwind overlay using existing provider state is standard UI work.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Existing dependencies already cover AI tools, providers, styling, and viewer. Only Vitest is clearly required; Playwright/RTL are optional. |
| Features | HIGH | Scope is strongly grounded in milestone context and direct codebase behavior; final wording/content facts remain MEDIUM until Lakshman approves copy. |
| Architecture | HIGH | Integration points are verified: `VoiceSessionProvider`, `voice-controller.ts`, `/api/chat`, `projects.ts`, `portfolio/page.tsx`, `IframeViewer`, `about/page.tsx`. |
| Pitfalls | HIGH | Privacy, data drift, ProjectDetail wiring, URL policy, and iframe limits are concrete code/browser risks; iframe feasibility details are MEDIUM/HIGH due to platform constraints. |

**Overall confidence:** HIGH

### Gaps to Address

- **Final approved copy:** Exact Parz tone, FSB/GitFly descriptions, and InfiniteChoice/Voyza wording need owner approval before prompt freeze.
- **Eval thresholds:** Directness, response length, and personality rubric thresholds should be tuned after first Vitest/live-eval run.
- **Global viewer placement:** Roadmap should choose layout-level viewer provider versus event-driven page host; research recommends layout-level provider.
- **Generic link policy:** Decide whether `openLink` is allowlist-only, confirmation-gated, or limited to known portfolio/social/project domains.
- **Browser result statuses:** Define callback status vocabulary before overlay implementation so the UI does not claim false success.
- **Playwright scope:** Decide whether automated E2E is worth the dependency weight for v4.1 or whether manual UAT is enough.

## Sources

### Primary (HIGH confidence)
- `.planning/research/STACK.md` — minimal-stack recommendation, required/optional test dependencies, AI SDK/tool guidance, roadmap implications.
- `.planning/research/FEATURES.md` — table stakes, differentiators, anti-features, concrete user behaviors, eval categories.
- `.planning/research/ARCHITECTURE.md` — provider/viewer/project-resolver architecture, build order, component boundaries, data flows.
- `.planning/research/PITFALLS.md` — privacy, data drift, ProjectDetail, iframe, URL, callback status, overlay, and eval risks.
- Directly referenced codebase files across research: `src/data/system-prompt.ts`, `src/data/projects.ts`, `src/app/api/chat/route.ts`, `src/lib/voice-controller.ts`, `src/providers/voice-session-provider.tsx`, `src/components/iframe-viewer.tsx`, `src/components/project-detail.tsx`, `src/app/portfolio/page.tsx`, `src/app/about/page.tsx`, `package.json`.

### External / implementation references
- Vercel AI SDK tool-calling docs — typed tools, schemas, tool lifecycle, MCP comparison.
- Vitest docs — local test runner setup and script workflow.
- Playwright docs — optional E2E verification role and install flow.
- React Testing Library docs — optional component test approach.
- MDN iframe reference — cross-origin iframe limits, sandbox/permissions, load/error behavior.

---
*Research completed: 2026-04-26*  
*Ready for roadmap: yes*
