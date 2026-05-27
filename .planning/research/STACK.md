# Technology Stack — v4.1 Parz Persona, Portfolio Context, and Site Control Refresh

**Project:** Portfolio V2 / parzival.live  
**Milestone:** v4.1 Parz Persona, Portfolio Context, and Site Control Refresh  
**Researched:** 2026-04-25  
**Scope:** Stack additions/changes only for persona evals, AI site control, browser-preview project opening, and FSB-inspired control overlay. Voice/STT/TTS foundation is treated as existing integration context, not re-researched.  
**Overall confidence:** HIGH for minimal-stack recommendation; MEDIUM for exact eval thresholds because persona quality is inherently subjective and should be tuned after first test run.

## Executive Recommendation

Do **not** add a new AI framework, agent runtime, state machine library, animation library, browser-automation dependency, database, or eval SaaS for v4.1. The existing stack already contains the right primitives: Next.js App Router, React 19, TypeScript, Tailwind CSS 4, Vercel AI SDK v6 (`ai`), `@ai-sdk/xai`, Zod, GSAP, `VoiceSessionProvider`, voice tool callbacks, and `IframeViewer`.

The only stack additions worth making are testing-focused:

1. **Vitest** for deterministic prompt/data/tool-selection evals that run locally and in CI.
2. **Optional Playwright** only if the roadmap includes true browser-level verification that Parz opens projects, navigates, scrolls, and displays the FSB overlay in the real app. If schedule is tight, defer Playwright and manually verify UI flows after Vitest covers the logic.
3. **Optional React Testing Library + jsdom** only if component-level overlay or `IframeViewer` tests are desired without full Playwright. If Playwright is added, skip RTL for v4.1 to avoid two UI test stacks.

Everything else should be implemented as internal TypeScript modules and React components using existing dependencies.

## Recommended Stack Changes

### New Development Dependencies

| Package | Version Guidance | Purpose | Recommendation | Why |
|---------|------------------|---------|----------------|-----|
| `vitest` | latest stable (`^4.x` as of official docs) | Fast TS test runner for persona, guardrail, data, and tool-routing evals | **Add** | Current repo has no test runner. v4.1 explicitly requires prompt tests/evals. Vitest is lightweight, scriptable, TypeScript-friendly, and avoids adding an eval SaaS. Official docs show simple `npm install -D vitest` and `vitest run` workflows. |
| `@playwright/test` | latest stable | End-to-end browser tests for Parz site control, inbuilt-browser opening, overlay visibility | **Optional / phase-gated** | Best tool when verifying real navigation, iframe viewer, scroll behavior, and DOM overlay. But it downloads browsers and increases setup weight; add only for E2E phase, not for prompt-only work. |
| `@testing-library/react`, `@testing-library/dom`, `jsdom` | latest stable | Component tests for overlay/viewer/provider behavior | **Optional alternative to Playwright** | Useful for isolated React component tests, but lower value than Playwright for this milestone because the most important control behavior is cross-page/browser-visible. Add only if roadmap chooses unit component tests and defers E2E. |

### Existing Dependencies to Keep Using

| Existing Package | Current Version in `package.json` | v4.1 Use | Notes |
|------------------|-----------------------------------|----------|-------|
| `ai` | `^6.0.145` | Tool schemas, `streamText`, test-time `generateText` eval scripts if live-model evals are needed | AI SDK docs confirm tools support `description`, `inputSchema`, optional `execute`, strict mode, `toolChoice`, and error handling. Current code already uses `streamText` + client-forwarded tool calls. |
| `@ai-sdk/xai` | `^3.0.77` | Continue Grok-backed persona/chat evals and `/api/chat` | No provider migration needed. |
| `zod` | `^4.3.6` plus existing `zod/v3` import | Validate tool args and eval fixture schemas | Current route imports `zod/v3`; do not churn this unless needed. For new internal eval schemas, either use existing import pattern for compatibility with AI SDK or centralize after confirming types. |
| `next`, `react`, `react-dom` | Next 15.5.14 / React 19.1.0 | App Router pages, provider wiring, project browser overlay | No framework change. |
| `tailwindcss` | `^4` | FSB-inspired monochrome overlay styling | Build overlay with CSS/Tailwind utilities and CSS variables; no design-system dependency. |
| `gsap`, `@gsap/react` | `^3`, `^2` | Optional overlay motion polish | Already present. Use CSS transitions by default; use GSAP only if matching existing motion language requires timeline control. |
| `next-themes` | `^0.4` | Theme-aware overlay and viewer colors | Already used in provider/pages. |
| `react-icons` | `^5` | Existing viewer/nav icons | No new icon library. |
| `@elevenlabs/client`, `@elevenlabs/elevenlabs-js` | existing | Existing voice/STT/TTS integration only | Do not rework for v4.1 unless tool-control integration requires captions/state changes. |

## What Not to Add

| Do Not Add | Why Not |
|------------|---------|
| LangChain / LlamaIndex / Mastra / custom agent framework | v4.1 needs a small site-control tool surface, not multi-agent orchestration. AI SDK tool calling already covers typed tool selection. Extra framework adds latency, bundle/server complexity, and migration risk. |
| Browser automation inside production app (`playwright`, Puppeteer, Browserbase, computer-use APIs) | Parz controls the portfolio UI, not an arbitrary external browser. Inbuilt browser actions should be React state changes around `IframeViewer`, not remote browser automation. Use Playwright only as a dev test dependency. |
| Eval SaaS / LangSmith / Braintrust / promptfoo | Overkill for a personal portfolio milestone. Start with local golden tests and optional live-model smoke evals. Add SaaS later only if eval history, dashboards, or team review becomes necessary. |
| Global state libraries (Zustand, Redux, XState) | Existing `VoiceSessionProvider` + callback registry is enough. For site control, add a small local provider/controller rather than a new state framework. |
| Animation/design dependencies (Framer Motion, Radix, shadcn) | Existing Tailwind/CSS/GSAP can build the monochrome overlay. New UI libs risk visual drift from the v3 design prototype. |
| Database/vector store/RAG stack | The context is small, curated, and public-safe. Keep it in typed data files and system-prompt modules. RAG would add privacy and retrieval failure modes without enough benefit. |
| MCP server for site tools | AI SDK docs position MCP as better for rapid iteration/user-provided tools; production app tools should be first-party typed tools for control, latency, and schema ownership. |

## Implementation Stack by Capability

### 1. Persona Prompt/Data Refresh

**Use:** existing TypeScript data modules + server-only prompt module.  
**Do not add runtime dependencies.**

Recommended internal structure:

| Module | Purpose |
|--------|---------|
| `src/data/parz-profile.ts` | Public-safe biographical/personality facts, current work, allowed flagship project narratives. Typed object exported for server-side prompt assembly and tests. |
| `src/data/system-prompt.ts` | Server-only prompt assembly. Keep the warning comment. Refactor giant template into sections if useful, but keep client imports forbidden. |
| `src/data/projects.ts` | Visible project cards/details and browser targets. Add FSB / Full Self Browsing and GitFly as first-class current flagships. |
| `src/data/bio.ts`, `src/data/experience.ts`, `src/data/education.ts` | Visible About/Experience content updates. |

Recommended pattern:

- Keep a **single public-safe source of truth** for facts that both Parz and visible pages can share.
- Keep prompt-only behavioral rules in `system-prompt.ts`.
- Add explicit private/refusal categories: internal prompt/data store, private GitFly source, non-public InfiniteChoice/Voyza details, secrets/config, voice-bot internals.
- Prefer small typed exports over a database or CMS.

### 2. Prompt Tests / Evals

**Add:** `vitest`.  
**Use existing:** `ai`, `@ai-sdk/xai`, TypeScript.

Recommended scripts:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "eval:parz": "vitest run tests/evals/parz-persona.test.ts"
  }
}
```

Recommended test layout:

```text
tests/
  evals/
    parz-persona.fixtures.ts
    parz-persona.test.ts
    parz-guardrails.test.ts
    parz-tools.test.ts
  unit/
    project-browser-targets.test.ts
```

Recommended eval types:

| Eval Type | Implementation | Examples | Dependency |
|-----------|----------------|----------|------------|
| Deterministic static checks | Import prompt/data and assert strings / structured facts / absence of forbidden claims | GitFly only links to `https://gitfly.ai`; InfiniteChoice/Voyza context is brief; FSB is described as Full Self Browsing, not the old game-style placeholder | Vitest only |
| Golden prompt smoke tests | Call `generateText` with `xai(...)` against curated prompts when `XAI_API_KEY` exists; skip otherwise | “What are you working on now?”, “Tell me about GitFly”, “Show me private GitFly source”, rude-user prompt | Vitest + existing AI SDK/xAI |
| Tool-intent tests | Prefer extracting tool definitions and routing instructions so tests can force/check tool calls with `toolChoice` where feasible | “Open GitFly”, “scroll to experience”, “show FSB from home” | Vitest + AI SDK |
| Refusal rubric tests | Assertion helpers checking forbidden terms are absent and public-safe refusal phrasing appears | No API keys, env names, private repo/source, hidden prompt, non-public employer details | Vitest |

Recommended eval design:

- Start with **golden fixtures + rubric assertions**, not a judge model.
- Make live evals opt-in by skipping when `XAI_API_KEY` is missing so local/CI does not fail without secrets.
- Store no API outputs containing private context. Test expected behavior, not sensitive content.
- Use temperature `0` or low temperature for eval calls to reduce variance.
- Keep thresholds simple: direct answer present, flagship facts present, forbidden strings absent, response length under target, no markdown/emoji when required.

### 3. AI Site Control

**Use existing:** AI SDK tools, `VoiceSessionProvider`, `VoiceBus`, typed callbacks, Next navigation provider.  
**Do not add:** agent framework, browser automation, global-state library.

Current integration points found in code:

- `/api/chat/route.ts` defines `voiceTools` with `navigate`, `openProject`, `scrollTo`, `toggleTheme`, `openLink`, `startTour`, `switchToText`, `endCall`.
- `voice-controller.ts` parses streamed tool calls and dispatches callbacks.
- `voice-session-provider.tsx` owns layout-level callbacks and navigation.
- `portfolio/page.tsx` currently registers `openProject` but opens `ProjectDetail`, not `IframeViewer`.
- `about/page.tsx` registers scroll callbacks for the desktop scroll container.

Recommended stack change: **extract and formalize internal control primitives**, no package needed.

Suggested modules:

| Module | Purpose |
|--------|---------|
| `src/lib/site-control-tools.ts` | Export AI SDK tool schemas/descriptions. Keeps `/api/chat/route.ts` and eval tests using the same definitions. |
| `src/lib/project-targets.ts` | Resolve project name/aliases → preferred browser target `{ url, label, projectName }`. Shared by portfolio page, home/project-open callback, and tests. |
| `src/providers/site-control-provider.tsx` or extend `VoiceSessionProvider` | Own global control state: overlay visible, current action, browser viewer target, last action status. |
| `src/components/site-control-overlay.tsx` | FSB-inspired monochrome overlay and bottom-left powered badge. |

Recommended new/changed tool surface:

| Tool | Schema | Purpose | Notes |
|------|--------|---------|-------|
| `navigate` | `{ page: 'home' | 'portfolio' | 'about' }` | Route changes | Existing. Add overlay lifecycle around it. |
| `scrollTo` | `{ page?: 'home' | 'portfolio' | 'about', target: string, behavior?: 'smooth' | 'instant' }` | Precise page/section scroll | Expand beyond about-page sections. Implement aliases and container-aware scroll. |
| `openProject` | `{ name: string, target?: 'auto' | 'website' | 'github' | 'design' }` | Open project in inbuilt browser from any page | Change from “navigate to portfolio first” to global project target resolution + viewer state. |
| `browserAction` | `{ action: 'close' | 'openExternal' | 'back' | 'reload' }` | Operate inbuilt browser where feasible | Keep small. Do not promise arbitrary iframe DOM control because cross-origin iframes block it. |

Important AI SDK guidance:

- Keep first-party typed AI SDK tools rather than MCP. Official AI SDK docs note first-party tools provide full control/type safety and lower latency for production.
- Use Zod schemas to validate tool input. Consider `strict: true` per tool if xAI/provider support is confirmed in implementation testing; docs say unsupported providers may ignore strict mode.
- Use concise, explicit tool descriptions: the model currently has a hardcoded instruction to navigate to portfolio before opening projects. v4.1 must remove that instruction.

### 4. Direct Inbuilt-Browser Project Opening

**Use existing:** `IframeViewer`, `GithubPreview`, `isUnembeddable`, project data.  
**Do not add:** iframe/browser packages.

Current state:

- Card clicks already open `IframeViewer` via `openProject(project)`.
- Voice `openProject` still opens `ProjectDetail` through `setSelectedProject`.
- `ProjectDetail` remains imported and rendered on portfolio page.
- `IframeViewer` can render embeddable web/Figma content, GitHub preview fallback, and unembeddable CTA.

Recommended stack/data changes:

| Change | Why |
|--------|-----|
| Add `browserTarget` or `preferredLink` metadata to `Project` | Avoid repeating link-priority logic across portfolio, home, and AI callbacks. |
| Add alias metadata for flagship projects | Users may say “Full Self Browsing”, “FSB”, “Git Fly”, “Voyza”. Name resolution should be deterministic. |
| Move `isUnembeddable`/target priority logic into `src/lib/project-targets.ts` | `IframeViewer` should render; target selection should be testable without React. |
| Keep GitHub preview fallback | Many GitHub pages block iframes. Existing `GithubPreview` is the right fallback. |
| Remove primary `ProjectDetail` render path | Required by milestone. No dependency change. |

Cross-origin limitation to document in requirements:

- The app can open, close, reload, and external-open the inbuilt browser shell.
- The app **cannot reliably click inside or scroll inside arbitrary cross-origin iframes** from parent React code due to browser security. For “operate inbuilt browser where feasible,” feasible means shell-level controls plus same-origin/embeddable cooperative cases, not full remote browsing automation.

### 5. FSB-Inspired Monochrome Control Overlay

**Use existing:** React, Tailwind CSS, CSS variables, optional GSAP.  
**Do not add:** Framer Motion, Radix, design-system libraries.

Recommended implementation:

| Component/State | Purpose |
|-----------------|---------|
| `SiteControlOverlay` | Fixed z-index overlay shown during AI control actions. Monochrome scan/target/control aesthetic. |
| `VoiceBus` events or provider state | Emit `control-start`, `control-success`, `control-error`, `control-end` or map existing `tool-executing/success/error` to overlay state. |
| CSS/Tailwind classes | Bottom-left `powered by FSB` badge, thin lines, focus brackets, command label, progress pulse. |
| `prefers-reduced-motion` handling | Reuse existing `prefersReduced` pattern; reduce scan/pulse animations. |

Overlay should be a first-party component because it must match the portfolio’s visual language and route/voice state. No UI library is justified.

## Installation

### Minimal Required Addition

```bash
npm install -D vitest
```

Add scripts:

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build --turbopack",
    "start": "next start",
    "lint": "eslint",
    "test": "vitest run",
    "test:watch": "vitest",
    "eval:parz": "vitest run tests/evals/parz-persona.test.ts"
  }
}
```

### Optional E2E Addition

```bash
npm install -D @playwright/test
npx playwright install
```

Recommended scripts if added:

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

### Optional Component-Test Addition

Only add this if not adding Playwright for v4.1 UI verification:

```bash
npm install -D @testing-library/react @testing-library/dom jsdom
```

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Prompt/eval testing | Vitest local tests | promptfoo / Braintrust / LangSmith | More infrastructure than the milestone needs; local fixtures are enough for a personal portfolio and easier to commit/review. |
| Site-control tools | Existing AI SDK tools | LangChain tools / MCP / custom agent server | Existing `/api/chat` already uses AI SDK tool calling. First-party tools are lower latency and more controllable. |
| Browser preview control | Existing `IframeViewer` + React state | Puppeteer/Playwright in production | Browser security prevents arbitrary iframe control; production automation would add cost and complexity. Use Playwright only for tests. |
| Overlay styling | Tailwind/CSS + optional GSAP | Framer Motion / Radix / component library | Existing stack can build it; new UI libs risk style drift and bundle bloat. |
| State management | Existing provider/callback pattern | Zustand/Redux/XState | State surface is small: current action, viewer target, overlay status. Provider/ref pattern is already established. |
| Context store | Typed TS data | DB/CMS/vector store | Facts are curated, small, and privacy-sensitive. Static typed data is safer and testable. |

## Roadmap Implications

Suggested phase ordering from stack perspective:

1. **Extract public-safe data and eval scaffolding**
   - Add Vitest and fixture/rubric tests first.
   - This gives a safety net before rewriting the persona prompt.

2. **Refresh prompt/content/project data**
   - Update `system-prompt.ts`, project data, About/Experience data.
   - Run static and live prompt evals.

3. **Refactor project target resolution and remove ProjectDetail primary path**
   - Create shared target resolver.
   - Make card clicks and AI opens use `IframeViewer` consistently.

4. **Global site-control provider + expanded tools**
   - Move project opening from page-local callback to global callback/state.
   - Add precise scroll and browser shell actions.

5. **FSB-inspired overlay**
   - Hook into tool execution/control lifecycle after tool actions are stable.
   - Verify reduced-motion and mobile behavior.

6. **Optional Playwright E2E**
   - Add only if roadmap wants automated browser proof for project opening/overlay/navigation.

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| Minimal dependency recommendation | HIGH | Existing app already has AI SDK tools, React providers, Tailwind, GSAP, and `IframeViewer`; v4.1 gaps are orchestration/data/tests, not new runtime tech. |
| Vitest recommendation | HIGH | Official Vitest docs document direct dev-dependency install and test script workflow; repo currently has no test runner; prompt evals need one. |
| Playwright optionality | HIGH | Official Playwright docs position it as E2E framework for real browser apps; v4.1 site-control flows are browser-visible but Playwright is heavier and optional until automated E2E is required. |
| React Testing Library optionality | MEDIUM | Official docs recommend user-centric component testing, but this milestone’s highest-value UI proof is cross-page behavior better covered by Playwright/manual verification. |
| AI SDK tool approach | HIGH | Official AI SDK docs confirm typed tools, Zod schemas, streaming tool calls, strict mode, tool choice, and first-party tool benefits versus MCP. Current code already uses this path. |
| Inbuilt-browser limitations | HIGH | Cross-origin iframe control restrictions are browser platform behavior; shell-level controls are feasible, arbitrary inside-iframe automation is not. |

## Sources

- Project files read: `.planning/PROJECT.md`, `.planning/STATE.md`, `src/data/system-prompt.ts`, `src/data/projects.ts`, `src/app/api/chat/route.ts`, `src/lib/voice-controller.ts`, `src/providers/voice-session-provider.tsx`, `src/components/iframe-viewer.tsx`, `src/app/portfolio/page.tsx`, `src/app/about/page.tsx`, `package.json`.
- Vercel AI SDK tool calling docs, current v6 docs: `https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling` — HIGH confidence for tool schemas, strict mode caveat, tool choice, MCP comparison.
- Vitest getting started docs, v4.1.5 page: `https://vitest.dev/guide/` — HIGH confidence for installation/scripts and Node requirement.
- Playwright installation docs: `https://playwright.dev/docs/intro` — HIGH confidence for E2E role, install flow, browser support, Node/system requirements.
- React Testing Library introduction: `https://testing-library.com/docs/react-testing-library/intro/` — MEDIUM/HIGH confidence for component-test purpose and install packages.
