# Phase 19: FSB-Inspired Control Overlay - Research

**Researched:** 2026-04-26
**Status:** Complete

## Implementation Findings

- `src/providers/site-control-provider.tsx` is the correct lifecycle owner because all Parz text and voice site-control paths call the shared provider methods added in Phase 18.
- `src/components/voice-glow.tsx` demonstrates the established pattern for a fixed, pointer-safe, theme-aware monochrome overlay using `next-themes`, hydration guarding, and global CSS classes.
- `src/components/iframe-viewer.tsx` uses `z-[100]`; the FSB overlay must stay below this surface or avoid pointer capture so browser close/external controls remain usable.
- `src/components/voice-overlay.tsx` uses `z-50`; the FSB overlay can render at a lower or equivalent visual layer with `pointer-events-none` so voice controls remain interactive.
- `src/app/globals.css` already hosts animation utilities and `prefers-reduced-motion` handling, so overlay animation CSS can live there without adding dependencies.

## Files To Modify

- `src/providers/site-control-provider.tsx` — add transient overlay state, lifecycle helper, and render overlay globally.
- `src/components/fsb-control-overlay.tsx` — new focused visual component for the monochrome overlay and badge.
- `src/app/globals.css` — add scan/grid/corner animation classes and reduced-motion overrides.

## Validation Architecture

- Static verification can grep for `FsbControlOverlay`, `powered by FSB`, `Parz is controlling the site.`, `pointer-events-none`, and wrapped provider methods.
- Runtime verification should confirm `npm run lint` and `npm run build` pass.
- Phase 20 owns Playwright E2E coverage for overlay timing during actual chat/voice commands.

## Risks And Constraints

- Overlay state must not trigger for manual user interactions. Wrapping only provider methods keeps this boundary intact.
- Overlay must clear on both success and failure. Use a `finally`-style lifecycle helper around synchronous control actions.
- Overlay should not flicker for very fast actions. Use a minimum visible duration before hiding.
- Reduced-motion users should still see the badge and static marks without animated scan motion.
