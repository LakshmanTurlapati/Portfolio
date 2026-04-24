# Phase 7: Circular Reveal Transition - Context

**Gathered:** 2026-04-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver a faithful circular reveal page transition matching Flutter's ClipPath behavior: the new page content is clipped inside an expanding circle from the clicked element's position while the old page remains visible outside the circle until it fully covers the viewport. This replaces the current solid-color overlay approach. All navigation paths (home, portfolio, about, chat) and browser back must use the reveal.

</domain>

<decisions>
## Implementation Decisions

### Reveal Strategy
- **D-01:** Use the **View Transitions API** (`document.startViewTransition`) as the primary mechanism. The browser snapshots the old page into `::view-transition-old(root)`, navigates via `router.push()`, then the new page renders as `::view-transition-new(root)`. Animate `clip-path: circle(...)` expanding on the `::view-transition-new(root)` pseudo-element using the Web Animations API (`document.documentElement.animate()`).
- **D-02:** Add `experimental: { viewTransition: true }` to `next.config.ts` (or the Next.js 15 equivalent `viewTransition: true` top-level flag).
- **D-03:** Remove the current `overlayRef` div from `TransitionProvider` — it is replaced by the browser's view-transition pseudo-elements.
- **D-04:** Circle math (maxRadius from origin using `sqrt(maxX^2 + maxY^2)`) stays the same — already correct from the Flutter implementation.

### Browser Fallback
- **D-05:** **Progressive enhancement.** Wrap the View Transitions call in `if (document.startViewTransition)`. If unavailable, fall back to the existing GSAP solid-color overlay approach (the current implementation). This means two code paths — View Transitions primary, GSAP fallback.
- **D-06:** View Transitions API is now Baseline Newly Available (Oct 2025) — Chrome 111+, Edge 111+, Firefox 133+, Safari 18+. The fallback is a safety net, not a primary path.

### Back Navigation
- **D-07:** Intercept `popstate` event in `TransitionProvider`. On back navigation, call `navigateWithReveal(previousPath, window.innerWidth / 2, window.innerHeight / 2)` — the reveal originates from screen center for back navigation.
- **D-08:** Track `previousPath` in a `useRef` inside `TransitionProvider`, updated each time `navigateWithReveal` fires.
- **D-09:** The `popstate` listener is read-only — no `history.pushState` re-push trick. Navigation goes through the same `navigateWithReveal` channel so the `isTransitioning` guard applies.

### Animation Tuning
- **D-10:** Duration: **500ms** (matches Flutter source's `Duration(milliseconds: 500)`).
- **D-11:** Easing: **power2.inOut** equivalent via Web Animations API (`cubic-bezier(0.455, 0.03, 0.515, 0.955)` or GSAP `power2.inOut` for fallback path).
- **D-12:** Origin point: **center of the clicked navigation element** (`rect.left + rect.width/2`, `rect.top + rect.height/2`). Deterministic and keyboard-accessible.
- **D-13:** Rapid-click guard: upgrade from `useState<boolean>` to `useRef<boolean>` to eliminate the render-cycle race condition gap. The guard blocks re-entry during the 500ms animation.

### Claude's Discretion
- Web Animations API keyframe structure for the `::view-transition-new(root)` clip-path animation
- Exact CSS for `::view-transition-old(root)` and `::view-transition-new(root)` pseudo-element styling
- How to structure the GSAP fallback alongside the View Transitions path (shared function vs conditional branch)
- Whether to add `view-transition-name` to specific elements for per-element transitions (likely unnecessary for full-page reveal)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Flutter Reference (original behavior to match)
- `lib/circular_reveal_page_route.dart` -- ClipPath with expanding circle from startOffset, 500ms duration, custom clipper

### Current Implementation (to be reworked)
- `src/providers/transition-provider.tsx` -- TransitionProvider with GSAP overlay, navigateWithReveal, isTransitioning guard
- `src/app/layout.tsx` -- TransitionProvider wrapping the app

### Navigation Callsites (consumers of navigateWithReveal -- interface must be preserved)
- `src/components/desktop-navbar.tsx` -- navigateWithReveal('/about', originX, originY)
- `src/components/mobile-navbar.tsx` -- navigateWithReveal('/about', originX, originY)
- `src/components/portfolio-button.tsx` -- navigateWithReveal('/portfolio', originX, originY)
- `src/app/portfolio/page.tsx` -- navigateWithReveal('/', ...)
- `src/app/about/page.tsx` -- navigateWithReveal('/', ...)
- `src/app/chat/page.tsx` -- navigateWithReveal('/', ...)

### API References
- View Transitions API: https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API
- Next.js viewTransition config: https://nextjs.org/docs/app/api-reference/config/next-config-js/viewTransition

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/providers/transition-provider.tsx` -- TransitionProvider context, navigateWithReveal function signature, circle math. The shell stays, internals change.
- GSAP already installed -- used for fallback path
- `useTransition()` hook used by 6 consumer files -- interface (`navigateWithReveal(path, originX, originY)` and `isTransitioning`) must be preserved

### Established Patterns
- Context provider pattern at `src/providers/` wrapping app in layout.tsx
- Theme detection via `useTheme()` from next-themes + `resolvedTheme`
- Destination background color mapping in `getDestinationBgColor()` -- still needed for GSAP fallback

### Integration Points
- `TransitionProvider` wraps entire app in `src/app/layout.tsx` (lines 54-56)
- `navigateWithReveal` called with `(path, originX, originY)` from navbar buttons and back buttons on content pages
- `isTransitioning` consumed by some components to prevent interaction during animation

</code_context>

<specifics>
## Specific Ideas

- The View Transitions API `transition.ready` Promise is the hook for starting the clip-path animation -- this is where the Web Animations API call goes
- The `::view-transition-new(root)` pseudo-element is the live new page content; `::view-transition-old(root)` is the snapshot of the old page
- For back navigation, using screen center as origin is visually close enough to Flutter's reverseDuration behavior without the fragile popstate re-push trick
- The `next.config.ts` change is a one-liner: `viewTransition: true` (or `experimental: { viewTransition: true }` depending on Next.js version)

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope.

</deferred>

---

*Phase: 07-circular-reveal-transition*
*Context gathered: 2026-04-24*
