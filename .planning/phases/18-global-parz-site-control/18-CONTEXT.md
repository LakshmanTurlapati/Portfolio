# Phase 18: Global Parz Site Control - Context

**Gathered:** 2026-04-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 18 gives Parz meaningful portfolio-shell control from any current page: route to home/portfolio/about, scroll to About/Experience/Academics, open approved project targets directly in the inbuilt browser without a portfolio-page detour, and operate feasible inbuilt-browser shell actions such as close viewer or open current project externally.

This phase should not implement the FSB-inspired monochrome control overlay or powered-by-FSB badge; those belong to Phase 19. Full regression/eval coverage belongs to Phase 20, though Phase 18 should keep the control layer testable and compatible with those future tests.

</domain>

<decisions>
## Implementation Decisions

### Control Architecture
- Add a small global client provider/controller so home, portfolio, about, chat, and voice can share one control surface. This matches the existing provider pattern (`VoiceSessionProvider`, `TransitionProvider`).
- Reuse the Phase 17 project resolver and dispatch a global open request that can mount/show `IframeViewer` without requiring a portfolio-page detour.
- Return explicit failure/status messages and trigger `tool-error`; never pretend third-party iframe DOM control succeeded.
- Only add the minimum shell/state needed for control. The FSB overlay/badge stays Phase 19.

### Navigation And Scroll Behavior
- Restrict navigation targets to `home`, `portfolio`, and `about`, matching CTRL-02 and the existing chat tool schema.
- For cross-page section scrolling, navigate to `/about`, then scroll after route completion using stable section ids/refs for `about`, `experience`, and `academics/education`.
- Use existing `navigateWithReveal` where available and a safe fallback otherwise.
- Keep the same command contract on mobile and desktop; account for 600px layout differences through shared section ids and shell actions.

### Parz Tool Contract
- Extend existing voice/chat tools minimally: keep `navigate`, `openProject`, and `scrollTo`; add browser shell actions like `closeBrowser` and `openCurrentProjectExternal`.
- Make site-control tools available from text chat as well as voice, since users can ask Parz from home, portfolio, about, or chat.
- Accept approved alias/slug/name for project opening, resolve locally, and reject unknown or non-approved model-generated URLs.
- Use a brief spoken/text response plus tool call; limitation responses should be honest and public-safe.

### Browser Shell Actions
- Support only feasible shell-level actions: close viewer and open current project externally when a current browser target exists.
- Track the active browser target in the global control layer so shell actions work regardless of current route.
- Use the approved resolved target already opened in the viewer for external opens; do not let Parz invent a new external URL.
- If no browser is open, say there is no current project/browser view to close or open externally.

### Claude's Discretion
- Exact provider, hook, event, and type names.
- Exact fallback copy, as long as it is clear, brief, and does not falsely claim unsupported control.
- Whether focused unit coverage is added in Phase 18 or left to Phase 20, as long as the implementation remains easy to cover.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/data/projects.ts` contains Phase 17 canonical aliases, approved browser targets, and resolver helpers for safe project opening.
- `src/app/portfolio/page.tsx` already opens project cards directly in `IframeViewer` and registers local voice callbacks for portfolio-specific project opening.
- `src/components/iframe-viewer.tsx` provides the inbuilt browser surface and unembeddable-host fallback behavior.
- `src/lib/voice-controller.ts`, `src/lib/voice-commands.ts`, and `src/app/api/chat/route.ts` contain the existing voice/chat tool contract for `navigate`, `openProject`, `scrollTo`, `toggleTheme`, `openLink`, and tour-related actions.
- `src/providers/voice-session-provider.tsx`, `src/providers/transition-provider.tsx`, and `src/providers/voice-bus-provider.tsx` establish the app's current client-provider pattern.

### Established Patterns
- Cross-page global behavior already uses React providers and client-side events where appropriate, including `parz:open-text-chat` for opening text chat from global controls.
- Navigation uses the app router plus the existing transition provider for reveal-style page transitions.
- Project/link safety is first-party and local-data-driven. Tool calls should resolve through local project/social/site data rather than arbitrary model-generated URLs.
- Current work intentionally separates Phase 18 control plumbing from Phase 19 visual overlay and Phase 20 full verification coverage.

### Integration Points
- Add the global control surface high enough in the app tree to be available on home, portfolio, about, and chat routes.
- Wire text chat and voice tool calls to the same global control implementation so behavior is consistent across interaction modes.
- Reuse `IframeViewer` as the single inbuilt-browser shell rather than creating a second browser component.
- About-page section targets need stable ids/refs for `about`, `experience`, and `academics`/`education` so cross-page scrolling can complete after navigation.

</code_context>

<specifics>
## Specific Ideas

- Project opening from any page should reuse the Phase 17 aliases for FSB, Full Self Browsing, GitFly, Review Gate, T2S, Parz-AI, and other canonical project records.
- GitFly must still open only `https://gitfly.ai`.
- Unsupported third-party iframe requests should be explained as a browser-security/shell-control limitation, not framed as Parz failing silently.
- Preserve the existing visual design. The visible control overlay is intentionally deferred to Phase 19.

</specifics>

<deferred>
## Deferred Ideas

- FSB-inspired monochrome control overlay and bottom-left `powered by FSB` badge belong to Phase 19.
- Full Vitest/Playwright coverage for navigation, scrolling, project opening, browser shell actions, and overlay behavior belongs to Phase 20.
- Arbitrary third-party iframe DOM control remains out of scope because browser security prevents reliable cross-origin control.

</deferred>
