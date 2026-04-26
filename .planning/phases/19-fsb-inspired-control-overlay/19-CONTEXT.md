# Phase 19: FSB-Inspired Control Overlay - Context

**Gathered:** 2026-04-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 19 adds the visible FSB-inspired control overlay for Parz-operated portfolio-shell actions. Users should see a monochrome, pointer-safe overlay and a bottom-left `powered by FSB` badge while Parz is actively navigating, opening projects, scrolling, closing/opening the inbuilt browser shell, or refusing unsupported iframe-control requests.

This phase should not add new control capabilities beyond the Phase 18 shell actions. Optional action captions, mobile-specific visual redesigns, and full Playwright/eval regression coverage remain deferred to Phase 20 or future overlay polish.

</domain>

<decisions>
## Implementation Decisions

### Overlay Triggering And Lifecycle
- Show the overlay only for real successful or attempted Parz site-control calls: `navigate`, `openProject`, `scrollTo`, `closeBrowser`, `openCurrentProjectExternal`, and unsupported iframe-control refusals.
- Start the overlay immediately before the control action, then clear after a short minimum visible duration once the action returns success, error, or blocked status.
- Extend `SiteControlProvider` with transient overlay state because it already owns global control actions and browser shell state.
- Do not show the overlay for manual user clicks, navigation, project-card opens, or general chat/voice thinking states.

### Visual Treatment
- Use a pointer-safe fixed monochrome layer with subtle scan/grid lines, corner/crosshair marks, and light/dark theme inversion.
- Include only the base overlay and bottom-left `powered by FSB` badge; action captions remain deferred as FSB-04.
- Keep the overlay visible but ambient so it signals AI operation without obscuring content or competing with the browser viewer.
- Let the overlay coexist with the existing voice glow and render above content but below critical browser/voice controls, with `pointer-events-none`.

### Accessibility And Responsive Behavior
- Mark decorative overlay visuals `aria-hidden`, but expose concise status through an `sr-only` live region such as “Parz is controlling the site.”
- Use the same component and behavior on desktop and mobile with responsive density; avoid a separate mobile treatment unless later verification finds issues.
- Respect `prefers-reduced-motion` by reducing animation to static monochrome marks and badge.
- Keep all core controls clickable while visible: close browser, voice controls, nav, page scrolling, and viewer controls must remain usable.

### Claude's Discretion
- Exact component name, CSS class names, animation timing, z-index, and provider state shape.
- Exact minimum visible duration, as long as the overlay does not flicker and clears cleanly after success/error/blocked outcomes.
- Exact visual geometry for scan lines, grid marks, corners, and crosshair details, as long as it stays monochrome and FSB-inspired.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/providers/site-control-provider.tsx` owns Phase 18 global control actions, active project browser state, and `IframeViewer` mounting. It is the best integration point for overlay lifecycle state.
- `src/components/voice-glow.tsx` already renders a fixed, pointer-safe monochrome visual layer driven by voice/tool state events and can inform overlay z-index and theme inversion patterns.
- `src/app/layout.tsx` mounts global providers and visual overlays, including `SiteControlProvider`, `VoiceSessionProvider`, `VoiceOverlay`, and `VoiceGlow`.
- `src/components/iframe-viewer.tsx` renders the inbuilt browser at `z-[100]` with close and external-open controls that must remain usable while the FSB overlay is visible.

### Established Patterns
- Global user-facing behavior is implemented with client providers and small focused components under `src/providers` and `src/components`.
- Theme-aware monochrome visuals use `next-themes` and CSS custom properties rather than color-coded states.
- Existing control behavior is first-party shell control only; unsupported third-party iframe control is a bounded refusal path, not a hidden automation attempt.
- Phase 19 should preserve Phase 18 control contracts and add visibility around them rather than expanding tool semantics.

### Integration Points
- Wrap each `SiteControlProvider` action with a start/finish overlay lifecycle helper so text chat and voice control paths both trigger the same visual feedback.
- Render the overlay globally inside or adjacent to `SiteControlProvider` so it appears across home, portfolio, about, chat, and active inbuilt-browser views.
- Keep overlay z-index below `IframeViewer` and voice controls where necessary, and set `pointer-events-none` to satisfy FSB-03.
- Add CSS in the existing global stylesheet or component-local classes for monochrome scan/grid/corner animations and reduced-motion behavior.

</code_context>

<specifics>
## Specific Ideas

- The badge text should be exactly `powered by FSB` and sit bottom-left during Parz control actions.
- The overlay should be visibly inspired by FSB's browser-control philosophy: observable, bounded, monochrome, and intentional rather than flashy or modal.
- Do not add action captions in this phase; `Opening GitFly` or `Scrolling Experience` style labels are explicitly deferred.

</specifics>

<deferred>
## Deferred Ideas

- FSB-04 optional action captions such as `Opening GitFly` or `Scrolling Experience` remain future overlay polish.
- FSB-05 dedicated mobile-specific visual treatment remains future polish unless Phase 20 verification reveals a concrete issue.
- Full Playwright E2E coverage for overlay/badge behavior belongs to Phase 20.

</deferred>
