# Architecture Patterns: v4.1 Parz Persona, Portfolio Context, and Site Control Refresh

**Domain:** Next.js App Router portfolio with persistent Parz voice/text agent, inbuilt browser, and portfolio data refresh  
**Researched:** 2026-04-25  
**Overall confidence:** HIGH for codebase integration points; MEDIUM for browser-control feasibility because iframe security limits are browser/platform-dependent.

## Executive Recommendation

Do **not** build a new agent framework, browser automation layer, global state store, or project-detail replacement UI. v4.1 should be a targeted refresh on top of the already-good v4.0 architecture:

1. Make `src/data/projects.ts` the public portfolio source of truth for project names, links, and project browser targets.
2. Replace the old monolithic `systemPrompt` content with a cleaner server-only prompt/data module that mirrors public-safe data and guardrails.
3. Move project opening control to the existing layout-level `VoiceSessionProvider`, because Parz must open projects from **any page**, not only after `/portfolio` mounts.
4. Keep `IframeViewer` as the project-opening surface and remove the right-side `ProjectDetail` path from `portfolio/page.tsx`.
5. Add a small global control overlay component driven by voice/tool execution state, not a full FSB clone.

The key architectural shift is this: **page-local callbacks are still useful for page-specific actions like About-page section scrolling, but global actions like opening a project/browser target should live in the session provider.** That avoids the current v4.0 problem where `openProject` must navigate to portfolio before a page-local callback exists.

## Current Architecture Snapshot

| Area | Current implementation | v4.1 implication |
|------|------------------------|------------------|
| AI prompt | `src/data/system-prompt.ts` server-only string imported by `/api/chat` | Modify heavily; keep server-only boundary. |
| Chat API | `src/app/api/chat/route.ts` uses AI SDK `streamText`, xAI model, optional `voiceTools` | Modify tool descriptions/schemas and guardrail instructions; no route split needed. |
| Voice session | `src/providers/voice-session-provider.tsx` owns `useVoiceController`, page navigation, theme/link callbacks | Extend here for global project/browser control and overlay state. |
| Voice controller | `src/lib/voice-controller.ts` owns STT/TTS, history, tool-call parsing, dispatch | Modify dispatch semantics only; avoid adding UI state here. |
| Voice commands | `src/lib/voice-commands.ts` holds static tour/legacy intent helpers | Update tour copy/project target; do not add major logic. |
| Project data | `src/data/projects.ts` holds `Project`, `PROJECT_DETAILS`, pinned/shuffle arrays | Extend fields minimally for `browserTarget`, `aliases`, `isPrivateSource`; update flagship content. |
| Portfolio page | `src/app/portfolio/page.tsx` has grid, `selectedProject`, `viewer`, imports `ProjectDetail` and `IframeViewer` | Remove `selectedProject`/`ProjectDetail`; card opens `IframeViewer` directly. |
| Inbuilt browser | `src/components/iframe-viewer.tsx` handles embeds, GitHub preview, blocked hosts, external-tab fallback | Keep; optionally add imperative actions via props or context later. |
| About page | `src/app/about/page.tsx` registers `scrollTo` page callback | Keep page-local scroll callback; update data content separately. |
| Home page | `src/app/page.tsx` owns chat popup event listener and home UI | Keep; optionally register page-ready event if global control needs precise home timing. |
| Transitions | `src/providers/transition-provider.tsx` exposes `navigateWithReveal` | Keep unchanged. |

## Recommended Architecture

```text
layout.tsx
└── VoiceSessionProvider                          # already persistent across routes
    ├── global site-control registry/state         # extend here, not in pages
    │   ├── navigate(page)
    │   ├── openProject(name, target?)             # NEW global action
    │   ├── openBrowser(url,label)                 # NEW global action/event
    │   ├── closeBrowser/backBrowser?              # optional minimal browser controls
    │   └── controlOverlayState                    # executing/success/error/caption
    │
    ├── VoiceOverlay / VoicePanel                  # existing voice UI
    ├── ParzControlOverlay                         # NEW visual overlay only
    └── pages
        ├── home page                              # can receive browser-open event if viewer rendered globally
        ├── portfolio page                         # grid + direct IframeViewer; no ProjectDetail
        └── about page                             # page-local scrollTo callback
```

### Preferred state ownership

| State/control | Should live in | Why |
|---------------|----------------|-----|
| Voice active/caption/transcript | `useVoiceController` via `VoiceSessionProvider` | Already implemented and persistent. |
| Tool callback registry | `VoiceSessionProvider` | Already implemented; good for page-local callbacks. |
| Global project lookup/opening | `VoiceSessionProvider` or a tiny helper imported by it | Must work from home/current page without portfolio detour. |
| Active browser viewer | Prefer global lightweight provider/component near layout; acceptable MVP: event + page-local viewer on portfolio | Parz must open browser from any page. Global viewer is cleaner than duplicating `IframeViewer` state in every page. |
| About scroll refs | `about/page.tsx` | Scroll container is page-local and uses refs; keep it there. |
| Portfolio grid controls | `portfolio/page.tsx` | Pure page UI; no need to globalize. |
| FSB control overlay visual state | `VoiceSessionProvider` + `ParzControlOverlay` | Overlay reflects tool execution globally; controller should emit events, provider owns UI state. |
| Prompt/data facts | `src/data/system-prompt.ts` and public data modules | Server-only prompt remains server-only; public page content remains normal data. |

## New vs Modified vs Removed

### New modules

| Module | Purpose | Notes |
|--------|---------|-------|
| `src/lib/project-targets.ts` or functions inside `src/data/projects.ts` | `findProjectByNameOrAlias()`, `getPreferredProjectTarget()` | Keep pure TypeScript; no React. Prefer central helper over duplicating link-priority logic. |
| `src/providers/browser-viewer-provider.tsx` **or** `src/components/global-iframe-viewer.tsx` | Global `IframeViewer` host so Parz can open a project from any route | Minimal: context with `openViewer({url,label})`, `closeViewer()`. |
| `src/components/parz-control-overlay.tsx` | FSB-inspired monochrome control overlay and bottom-left `powered by FSB` badge | Visual only; driven by control state/events. |
| `tests`/eval fixture file for prompt cases | Persona/grounding/guardrail tests | Exact runner depends existing test setup; architecture only requires stable prompt API seam. |

### Modified modules

| Module | Required change |
|--------|-----------------|
| `src/data/system-prompt.ts` | Rewrite prompt/data store: direct first, personality-grounded, current public-safe facts, guardrails, rude-user policy, no internal-detail leakage. Consider exporting smaller typed sections and composing string server-side. |
| `src/data/projects.ts` | Add/update FSB, GitFly, InfiniteChoice/Voyza-related public context where appropriate. Add aliases and browser-target metadata. Mark GitFly source private by omission or explicit `privateSource: true`; link only `https://gitfly.ai`. |
| `src/app/api/chat/route.ts` | Update `voiceToolInstructions`; `openProject` should no longer say “Navigate to portfolio first.” Add browser-control tools only for feasible actions. |
| `src/lib/voice-controller.ts` | Stop forcing `openProject` through `goPage('portfolio')`. Dispatch global `openProject` directly. Emit/drive control-overlay states around meaningful tool calls. |
| `src/providers/voice-session-provider.tsx` | Add global `openProject` implementation, project lookup, browser viewer opening, and control overlay state. Keep page callback registry for page-specific tools. |
| `src/app/portfolio/page.tsx` | Remove `ProjectDetail` import/state/render. Card click calls shared `openProjectInViewer(project)` or `openViewer(getPreferredProjectTarget(project))`. Voice callback should no longer call `setSelectedProject`. |
| `src/components/iframe-viewer.tsx` | Keep core viewer. Optional: expose close/open-new-tab controls to Parz through provider methods; do not attempt cross-origin DOM control. |
| `src/lib/voice-commands.ts` | Update tour step from old Parz-AI favorite to FSB/GitFly flagship if desired. |
| `src/app/about/page.tsx` | Content/data updates and possibly richer scroll aliases. Keep scroll implementation. |
| `src/app/page.tsx` | Content only unless global browser viewer is not layout-level. If no global viewer is added, home must host viewer state, but that is less clean. |

### Removed/deprecated path

| Remove/deprecate | What to delete or stop using |
|------------------|------------------------------|
| Right-side project detail panel | Remove `selectedProject` state, `ProjectDetail` render block, and `ProjectDetail` import from `portfolio/page.tsx`. |
| `src/components/project-detail.tsx` | Delete if no other imports remain, or leave unused for one phase only if deletion risk is high. Roadmap should include cleanup. |
| Voice `openProject` portfolio detour | Remove `goPage('portfolio'); await waitForPage('portfolio')` from `voice-controller.ts` tool handling. |
| Project detail as voice target | Do not call `setSelectedProject` from voice. Voice project opening should resolve a URL and open `IframeViewer`. |

## Data Flow

### Parz opens a project from home/current page

```text
User: “Show me GitFly”
  ↓
/api/chat returns text + tool call openProject({ name: "GitFly" })
  ↓
voice-controller parses tool call
  ↓
dispatchToolCall('openProject', { slug/name: 'GitFly' })
  ↓
VoiceSessionProvider global openProject
  ↓
findProjectByNameOrAlias('GitFly')
  ↓
getPreferredProjectTarget(project)
  ↓
openViewer({ url: 'https://gitfly.ai', label: 'Visit site' })
  ↓
Global IframeViewer opens; if blocked/unembeddable, existing fallback UI offers new tab
```

### User clicks a portfolio card

```text
PortfolioCard.onOpen(project)
  ↓
shared openProjectInViewer(project)
  ↓
setViewer/openViewer({ url, label })
  ↓
IframeViewer
```

This keeps manual and AI-triggered project opening consistent.

### Page navigation and scrolling

```text
navigate(page)
  → VoiceSessionProvider.goPage()
  → TransitionProvider.navigateWithReveal()

scrollTo(section)
  → if about page callback registered: about/page.tsx scrollToSection()
  → if not on about page: navigate('about'), waitForPage('about'), then dispatch scrollTo
```

For v4.1, only add the second branch if users explicitly expect “show my experience” to work from home. It is useful but should reuse existing `waitForPage`; do not build a generic DOM automation engine.

## Browser Control Limitations

Be explicit in prompt/tool behavior: Parz can operate the **portfolio’s inbuilt browser chrome**, not arbitrary third-party pages.

| Desired action | Feasible? | Implementation |
|----------------|-----------|----------------|
| Open project website/GitHub/design in inbuilt browser | YES | Global viewer provider + `IframeViewer`. |
| Close inbuilt browser | YES | Provider `closeViewer()`. |
| Open current viewer URL in new tab | YES | Provider stores active URL and calls `window.open`. |
| Switch between project targets (Website/GitHub/Design) | YES | Use project `links` metadata and viewer provider. |
| Navigate site pages | YES | Existing `goPage`/`navigateWithReveal`. |
| Scroll About sections precisely | YES | Existing refs in `about/page.tsx`. |
| Scroll inside same-origin portfolio pages | YES | Page-local callbacks/refs. |
| Click buttons inside arbitrary iframe | NO for cross-origin | Browser same-origin policy blocks DOM access. Do not promise this. |
| Read arbitrary iframe content | NO for cross-origin | Use fallback previews only for known sources like `GithubPreview`. |
| Force embed sites that block iframes | NO | Existing `isUnembeddable` and blocked fallback are correct. |

## Patterns to Follow

### Pattern 1: Shared project target resolver

**What:** One pure function decides which URL opens for a project.

```typescript
type ProjectTargetKind = 'website' | 'design' | 'github';

export function getPreferredProjectTarget(project: Project, preferred?: ProjectTargetKind) {
  const links = project.links || {};
  if (preferred === 'website' && links.Website) return { url: links.Website, label: 'Visit site' };
  if (preferred === 'design' && links.Design) return { url: links.Design, label: 'Design' };
  if (preferred === 'github' && links.GitHub) return { url: links.GitHub, label: 'Source' };

  if (links.Website && !isUnembeddable(links.Website)) return { url: links.Website, label: 'Visit site' };
  if (links.Design) return { url: links.Design, label: 'Design' };
  if (links.Website) return { url: links.Website, label: 'Visit site' };
  if (links.GitHub) return { url: links.GitHub, label: 'Source' };
  return null;
}
```

**Why:** Today `portfolio/page.tsx` has this priority inline. v4.1 needs the same logic from voice/session code.

### Pattern 2: Global viewer provider, local viewer UI unchanged

**What:** Keep `IframeViewer` as a controlled component, but mount its controller once near layout.

```typescript
interface BrowserViewerContextType {
  openViewer: (viewer: { url: string; label: string }) => void;
  closeViewer: () => void;
  openExternal: () => void;
  activeViewer: { url: string; label: string } | null;
}
```

**Why:** This is the smallest way to let home/voice/portfolio all open the same inbuilt browser without routing to portfolio.

### Pattern 3: Control overlay reacts to tool state, not business logic

**What:** `ParzControlOverlay` should display captions like “Opening GitFly”, “Navigating to About”, “Scrolling to Experience”, plus the `powered by FSB` badge. It should not perform actions.

**Why:** Keeps the FSB-inspired overlay decorative/communicative rather than becoming a second control system.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Building a generic browser automation layer

**Why bad:** Cross-origin iframes cannot be controlled, and a generic command DSL would be overkill for a portfolio.  
**Instead:** Implement named site tools: `navigate`, `scrollTo`, `openProject`, `openBrowserTarget`, `closeBrowser`, `openExternal`.

### Anti-Pattern 2: Keeping ProjectDetail as a hidden voice-only path

**Why bad:** User explicitly rejected the right-side detail panel as not part of the design. Keeping it creates inconsistent manual vs AI behavior.  
**Instead:** Delete or fully disconnect it and route all opens to `IframeViewer`.

### Anti-Pattern 3: Duplicating project facts in prompt and UI without a plan

**Why bad:** FSB/GitFly/InfiniteChoice updates will drift between cards, About page, and Parz answers.  
**Instead:** Keep `projects.ts` as public UI source; compose prompt from audited public-safe text or mirror it deliberately with tests.

### Anti-Pattern 4: Exposing internal implementation in Parz answers

**Why bad:** Current prompt talks about internals and data-store behavior; v4.1 requires refusal for internal context, private source, API keys/config, and voice bot internals.  
**Instead:** Add guardrails in `system-prompt.ts` and evals for refusal behavior.

## Recommended Build Order

1. **Data model and content safety foundation**
   - Update `projects.ts` with FSB, GitFly, aliases, target links, and private-source constraints.
   - Update About/Experience data modules for InfiniteChoice/Voyza public-safe context.
   - Rationale: every later prompt/tool feature depends on accurate project names and links.

2. **Remove ProjectDetail path and unify manual project opening**
   - Remove `selectedProject` and `ProjectDetail` from `portfolio/page.tsx`.
   - Extract/reuse preferred target resolver.
   - Verify card clicks open `IframeViewer` directly.
   - Rationale: establishes the intended project UX before AI controls it.

3. **Add global browser viewer/openProject control**
   - Add viewer provider or layout-level viewer host.
   - Extend `VoiceSessionProvider` with global `openProject` using project resolver.
   - Modify `voice-controller.ts` to stop navigating to portfolio before `openProject`.
   - Rationale: satisfies “open projects from current page/home”.

4. **Refresh `/api/chat` tools and Parz prompt**
   - Update `voiceToolInstructions` to reflect direct project opening and feasible browser controls.
   - Rewrite `system-prompt.ts` for direct personality-grounded answers, public-safe facts, rude-user policy, and internal-detail refusals.
   - Rationale: tool behavior and persona should align after the control surface exists.

5. **Add FSB-inspired control overlay**
   - Add `ParzControlOverlay` driven by tool execution state from provider/VoiceBus events.
   - Keep it monochrome and minimal with bottom-left `powered by FSB` badge.
   - Rationale: visual polish after actions are real.

6. **Prompt tests/evals**
   - Add tests for persona directness, factual grounding, flagship project answers, rude-user behavior, and refusal of internal/private details.
   - Rationale: prompt changes need regression protection after all source facts/tools are finalized.

## Phase-Specific Risks

| Phase topic | Risk | Mitigation |
|-------------|------|------------|
| Project data refresh | GitFly private source accidentally exposed | Do not include GitHub/source link; add eval asking for GitFly source. |
| Prompt rewrite | Parz becomes either too verbose or too bland | Eval direct-answer style and personality tone separately. |
| Open project from home | Page-local callback unavailable | Move `openProject` to `VoiceSessionProvider`, not `portfolio/page.tsx`. |
| Removing ProjectDetail | Dead imports/styles remain | Search imports after removal; run build/lint. |
| Inbuilt browser control | Overpromising cross-origin control | Tool descriptions must say open/close/switch targets, not click/read inside third-party pages. |
| Overlay | Competes with existing `VoiceOverlay`/navbar z-index | Make overlay pointer-events none, z-index below modal viewer but above page chrome; hide or reduce when `IframeViewer` is active if necessary. |
| Tool call streaming | AI SDK event parsing is custom in `voice-controller.ts` | Keep schemas simple; test each tool call with live `/api/chat` stream. |

## Minimal Architecture Decision

The minimal durable v4.1 architecture is:

- **Keep:** Next.js App Router, `VoiceSessionProvider`, `VoiceBus`, `TransitionProvider`, `IframeViewer`, page-local About scrolling.
- **Modify:** `system-prompt.ts`, `projects.ts`, `/api/chat` tool instructions, `voice-controller.ts` openProject dispatch, `voice-session-provider.tsx` global control, `portfolio/page.tsx` project opening.
- **Add:** shared project target resolver, global viewer host/provider, FSB-inspired visual control overlay, prompt evals.
- **Remove:** `ProjectDetail` panel path and voice behavior that detours through the portfolio page just to open project details.

## Sources

Verified directly from mandatory project files:

- `.planning/PROJECT.md` and `.planning/STATE.md` — v4.1 scope, decisions, constraints, and explicit ProjectDetail removal requirement.
- `src/data/system-prompt.ts` — current monolithic server-only prompt/data store and guardrail gaps.
- `src/data/projects.ts` — current project/link/detail model and existing link priority needs.
- `src/app/api/chat/route.ts` — current voice tools and outdated “navigate to portfolio first” instruction.
- `src/lib/voice-controller.ts` — current tool dispatch, forced portfolio navigation for `openProject`, STT/TTS/session ownership.
- `src/lib/voice-commands.ts` — static tour path and old Parz-AI-focused tour step.
- `src/providers/voice-session-provider.tsx` — persistent session provider and callback registry.
- `src/components/voice-overlay.tsx` — existing overlay positioning and z-index considerations.
- `src/components/iframe-viewer.tsx` — inbuilt browser behavior, unembeddable host limitations, GitHub preview fallback.
- `src/components/project-detail.tsx` — right-side panel path to remove.
- `src/app/portfolio/page.tsx` — current `ProjectDetail` state path and local iframe viewer opening logic.
- `src/app/page.tsx` — home voice/chat integration and lack of project viewer state.
- `src/app/about/page.tsx` — page-local scroll refs/callbacks.
- `src/providers/transition-provider.tsx` — existing navigation primitive to reuse unchanged.
