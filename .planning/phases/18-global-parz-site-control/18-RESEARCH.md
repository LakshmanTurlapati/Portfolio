# Phase 18: Global Parz Site Control - Research

## RESEARCH COMPLETE

## Objective

Research how to implement Phase 18 so Parz can control portfolio navigation, section scrolling, approved project opening, and feasible inbuilt-browser shell actions from any current page.

## Current Implementation

- `src/providers/voice-session-provider.tsx` owns the current global voice session and already has access to `useTransition`, `usePathname`, theme toggling, `openLink`, and page navigation.
- `src/lib/voice-controller.ts` dispatches AI tool calls from `/api/chat` for voice mode, but `openProject` currently navigates to portfolio before opening a project.
- `src/app/api/chat/route.ts` exposes tools only when `isVoice` is true. Text chat currently receives no tool definitions, so text-mode site control cannot execute.
- `src/app/portfolio/page.tsx` directly opens `IframeViewer` with Phase 17 project resolver output. The inbuilt browser is still page-local.
- `src/components/iframe-viewer.tsx` already implements the browser shell, close action, external open action, unembeddable-host fallback, and Escape close.
- `src/app/about/page.tsx` has internal refs for `about`, `experience`, and `academics`, but scroll tool registration is page-local.
- `src/data/projects.ts` has `resolveProject`, `isApprovedProjectUrl`, and `getProjectBrowserTarget`, which are the correct safety foundation for Phase 18.

## Recommended Architecture

Use one global client provider for site control, placed in `src/app/layout.tsx` inside the existing provider stack. The provider should expose a hook with:

- `navigate(page: 'home' | 'portfolio' | 'about')`
- `openProject(name: string): ControlResult`
- `scrollTo(section: 'about' | 'experience' | 'academics')`
- `closeBrowser(): ControlResult`
- `openCurrentProjectExternal(): ControlResult`
- `registerAboutScroller(callback)` for the about page's internal scroll container

The provider should render a single global `IframeViewer` instance when `openProject` resolves an approved target. That removes the need to navigate to `/portfolio` solely to mount browser state.

## Tool Integration

- Voice mode should continue to call `/api/chat` with `isVoice: true`, but `voice-controller` should call global control callbacks directly instead of routing project opening through portfolio.
- Text chat should call `/api/chat` with a new site-control mode flag and send returned tool invocations to the same global control hook.
- `/api/chat` should expose the same safe site-control tools for text and voice when requested, with schema arguments constrained to local action names and enums.
- Do not expose arbitrary URL opening for project/browser actions. `openLink` can remain for social/public URLs if already used, but project opening must route through project records.

## Browser Shell Actions

- `closeBrowser` is a shell action over global `IframeViewer` state.
- `openCurrentProjectExternal` should use only the active approved URL tracked by the global browser state.
- Unsupported third-party iframe actions should be represented as a tool or limitation response that does not mutate state.

## Validation Architecture

Manual verification is required for AI tool-call behavior until Phase 20 adds Vitest/Playwright coverage. Phase 18 can still verify statically that:

- `src/providers/site-control-provider.tsx` exists and imports `resolveProject`, `getProjectBrowserTarget`, and `IframeViewer`.
- `src/app/layout.tsx` wraps the app in `SiteControlProvider`.
- `src/app/api/chat/route.ts` exposes browser shell tool names and includes control limitation instructions.
- `src/lib/voice-controller.ts` handles `closeBrowser`, `openCurrentProjectExternal`, and unsupported control calls.
- `src/app/about/page.tsx` registers the about scroll handler with the global control provider.
- `npm run lint` passes.

## Risks

- The AI SDK UI stream shape for client-side tool invocations differs across versions. Implementation should inspect `message.parts` defensively and ignore unsupported part shapes.
- About page uses an internal scroll container, so global `window.scrollTo` is insufficient.
- Multiple providers can cause stale callbacks. Use stable refs in the provider for registered page-specific callbacks.
- Text chat and popup duplicate code. Keep tool dispatch small in each place and avoid a broad UI refactor in Phase 18.
