---
phase: 27-fsb-overlay-polish
plan: 03
subsystem: ui
tags: [fsb, overlay, mobile, responsive, accessibility, wcag-2.5.5, media-query, css]

# Dependency graph
requires:
  - phase: 27-fsb-overlay-polish
    provides: caption-state-machine + IDLE_TEXT badge content (Plan 27-02)
  - phase: 26-mobile-ux-pass
    provides: useMediaQuery hook (768px convention)
  - phase: 23-dynamic-voice-output
    provides: FSB overlay desktop baseline (pixel-identical target)
provides:
  - mobile-fsb-overlay-treatment
  - fsb-grid-jsg-gate-768px
  - wcag-2.5.5-compliant-badge-hit-area
  - badge-min-width-anti-layout-shift
  - phase-27-breakpoint-reconciliation
affects: [fsb-control-overlay.tsx, globals.css]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - js-side-media-query-gating-with-ssr-safe-default-false
    - wcag-2.5.5-touch-target-via-min-height-plus-flex-centering
    - documented-breakpoint-reconciliation-comment-block

key-files:
  created: []
  modified:
    - src/components/fsb-control-overlay.tsx
    - src/app/globals.css

key-decisions:
  - "Used `(min-width: 768px)` (NOT max-width) so SSR/pre-mount default of FALSE keeps grid hidden during hydration on mobile (no desktop-grid flash)"
  - "Kept existing 600px `@media` block for corners + target ornaments (UI-SPEC acceptable alternative path) — created an explicit 600-768px in-between zone where ornaments use desktop sizing but grid is hidden"
  - "Consolidated badge sizing to a NEW `(max-width: 47.99rem)` block (≈ 767.84px, just under 768px) to align with the JS grid gate at 768px without overlap"
  - "Added `min-width: 220px` desktop / `min-width: 180px` mobile + `text-align: center` + `box-sizing: border-box` to prevent caption layout shift across the 7 caption strings"
  - "Mobile badge uses `display: inline-flex` + `align-items: center` + `justify-content: center` to vertically center text inside the taller (44px) box; desktop still inherits default block-level rendering at >= 768px"
  - "Removed the obsolete `padding: 8px 12px; font-size: 9px` mobile badge override (failed WCAG 2.5.5 ~28px tall); replaced with WCAG-compliant 44px hit area"
  - "Kept overlay container `pointer-events-none` Tailwind class unchanged — mobile users can still tap through underlying content beneath the larger badge (T-27-07 mitigation)"

patterns-established:
  - "JS-side breakpoint gates use `min-width` query so SSR-safe default (false) maps to the conservative render (mobile)"
  - "Comment block above breakpoint hooks documents reconciliation with neighboring CSS @media rules so future maintainers see the chosen single source of truth"
  - "WCAG 2.5.5 hit-area achieved via explicit `min-height: 44px` + flex centering, not relying on padding+line-height math alone"

requirements-completed: [FSB-05]

# Metrics
duration: 2 min
completed: 2026-04-26
---

# Phase 27 Plan 03: FSB Mobile Overlay Treatment Summary

**Mobile FSB overlay treatment via JS `useMediaQuery('(min-width: 768px)')` grid gate plus a new `@media (max-width: 47.99rem)` badge rule that delivers an 11px / 12px-16px-padding / 44px-min-height WCAG 2.5.5 touch target, while leaving the >= 768px desktop pixel-identical to the Phase 23 baseline.**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-04-26T23:58:27Z
- **Completed:** 2026-04-27T00:00:23Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- The full-bleed FSB scan grid (`.fsb-control-grid`) is now hidden on viewports below 768px via a JS-side `useMediaQuery('(min-width: 768px)')` gate inside `fsb-control-overlay.tsx`. The hook returns FALSE on first render (server / pre-mount), so mobile clients never see a hydration flash of the desktop grid.
- The FSB badge (`.fsb-control-badge`) now meets WCAG 2.5.5 / Apple HIG touch-target on mobile: 11px font, 12px/16px padding, 0.14em letter-spacing, 180px min-width, and an explicit 44px min-height locked via a NEW `@media (max-width: 47.99rem)` block. Inline-flex centering vertically aligns text in the taller box.
- Desktop (>= 768px) renders pixel-identical to the Phase 23 baseline. The base `.fsb-control-badge` rule gained only `min-width: 220px`, `text-align: center`, and `box-sizing: border-box` — additive properties that don't shift the existing position, fonts, padding, border, or backdrop-filter.
- Caption layout-shift across the 7 caption strings (longest: `NAVIGATING TO PORTFOLIO…` ~25 chars uppercased) is now prevented by the 220px desktop / 180px mobile min-widths.
- Phase 27 breakpoint reconciliation is documented in source: a comment block above the new `useMediaQuery` line names the chosen split — grid gated at 768px (JS), corners + target gated at 600px (existing CSS, kept), badge sizing consolidated to 768px (CSS).
- Pointer-safety preserved: overlay container still has `pointer-events-none` Tailwind class on every viewport. No descendant overrides to `pointer-events: auto`. Mobile tap-through to underlying content remains intact (T-27-07 mitigation).

## Task Commits

Each task was committed atomically:

1. **Task 1: Gate `.fsb-control-grid` behind `useMediaQuery` in fsb-control-overlay.tsx** — `3b89d42` (feat)
2. **Task 2: Update FSB badge CSS for 44px mobile hit-area + min-width for caption** — `f01a5d1` (feat)

## Files Created/Modified

- `src/components/fsb-control-overlay.tsx` — Added `useMediaQuery` import alongside the existing `useMounted` import. Inside the `FsbControlOverlay` function body, added a documented Phase 27 breakpoint reconciliation comment block followed by `const isDesktop = useMediaQuery('(min-width: 768px)')`. Wrapped the `.fsb-control-grid` JSX in `{isDesktop ? <div className="fsb-control-grid" /> : null}`. Caption state machine, useEffect subscriptions, timer refs, sr-only mirror, and pointer-events-none container class from Plan 27-02 are unchanged. (16 lines added, 1 line replaced.)
- `src/app/globals.css` — Two surgical edits in the Phase 19 FSB block. (1) Base `.fsb-control-badge` rule gained `min-width: 220px`, `text-align: center`, `box-sizing: border-box` (with a Phase 27 / FSB-04 explanatory comment) — added after `text-transform: uppercase;`, before the `backdrop-filter` declarations, so desktop rendering remains otherwise pixel-identical to Phase 23. (2) The obsolete `.fsb-control-badge { padding: 8px 12px; font-size: 9px; }` override was removed from the existing `@media (max-width: 37.5rem)` block (corners + target overrides retained), and a new `@media (max-width: 47.99rem)` block was added (after the 600px block, before `prefers-reduced-motion`) with `padding: 12px 16px`, `font-size: 11px`, `letter-spacing: 0.14em`, `min-width: 180px`, `min-height: 44px`, plus inline-flex centering. Total: 18 lines added, 2 lines deleted.

## Decisions Made

1. **`(min-width: 768px)` not `(max-width: 768px)`.** Per Plan instruction and `useMediaQuery` SSR semantics: the hook returns FALSE on first render. Inverting the polarity to `min-width` means mobile (the conservative case) is the SSR default, so a mobile client never sees a desktop grid flash during hydration.
2. **Acceptable alternative reconciliation, not full migration.** UI-SPEC offered two paths: (a) migrate the entire 600px `@media` block to JS at 768px, or (b) keep the 600px CSS for corners+target and gate only the grid + badge sizing at 768px. Picked (b) because corners and target adjustments don't affect hit-area, the existing 600px rule has been visually validated since Phase 19, and migrating the corners/target to JS would introduce risk without functional gain. The 600-768px in-between zone (corners use desktop sizing, grid hidden) is documented in the source comment block.
3. **Badge breakpoint at 47.99rem, not 48rem.** 47.99rem ≈ 767.84px, which is exactly under the JS 768px gate. Using 48rem (= 768px exactly) would create a 1px overlap at viewport width 768px where both the JS gate would fire `isDesktop=true` AND the CSS mobile badge rule would still apply. 47.99rem cleanly mirrors the JS `(min-width: 768px)` gate's complement.
4. **Explicit `min-height: 44px` + flex centering.** Padding-only math (12 + 12 + 11 × 1.2 ≈ 37px) is short of 44px. Locking `min-height: 44px` makes the WCAG compliance test pass regardless of font-metric quirks across browsers; `display: inline-flex` + `align-items: center` + `justify-content: center` then visually centers the text inside the now-taller box. These flex declarations live ONLY inside the mobile `@media` block, so desktop rendering at >= 768px is unchanged (default block-level box, height = padding + line-height).
5. **`min-width: 220px` desktop / `180px` mobile.** Recommended values from UI-SPEC. 220px desktop accommodates the longest uppercased caption (`NAVIGATING TO PORTFOLIO…` ≈ 25 chars × 10px font × 0.16em letter-spacing ≈ 195px width plus 32px horizontal padding). 180px mobile handles the same caption at 11px font / 0.14em letter-spacing / 32px padding without wrapping. Caption swaps are now layout-shift-free.
6. **`text-align: center` + `box-sizing: border-box` on base rule.** Without `text-align: center`, the text would left-align inside the 220px min-width box and the badge would look badly off-center vs the existing right-padded version. With `box-sizing: border-box`, the 220px includes border (1px each side) so the visible box is what's specified — predictable on mobile too where padding grows.
7. **Pointer-events untouched.** Per T-27-07 in the threat register, `pointer-events: none` on the overlay container must be preserved on every viewport. No Tailwind `pointer-events-auto` overrides were added to the badge or any descendant. The 44px target is purely a VISUAL spec — the badge is non-interactive — but WCAG 2.5.5 still applies because adjacent interactive elements (under the badge) must avoid being obscured.

## Deviations from Plan

None — plan executed exactly as written. Both tasks were surgical, the verification grep checks all passed on first attempt, and `npx tsc --noEmit` exits clean.

## Issues Encountered

None. Type-check ran clean. No build errors. No test failures (no existing FSB overlay tests).

## User Setup Required

None — no external service configuration required.

## Threat Surface

No new attack surface introduced. The only threats this plan touches are:

- **T-27-07 (DoS / UX — mobile users blocked from interacting with content under the larger badge):** mitigated. Verified the overlay container retains the `pointer-events-none` Tailwind class on line 191 of `fsb-control-overlay.tsx`. The badge inherits `pointer-events: none` and remains non-interactive. No descendant overrides added in this plan. The 44px hit-area spec is purely visual (WCAG 2.5.5 compliance for adjacent interactive elements that must avoid the badge zone).
- **T-27-08 (Information Disclosure — caption text):** accepted, unchanged in this plan. Captions are static strings or LLM-supplied tool args (project slug, page route name) — not sensitive.

No threat flags raised: no new network endpoints, no new auth paths, no new file access, no new schema changes. Both edits are presentational.

## Self-Check: PASSED

- FOUND: `src/components/fsb-control-overlay.tsx` (modified, line 19 import + lines 79-92 hook+comment + line 193 conditional render)
- FOUND: `src/app/globals.css` (modified, lines 394-398 base-rule additions + lines 416-430 new mobile @media block)
- FOUND commit `3b89d42`: `feat(27-03): gate FSB scan grid behind 768px media query`
- FOUND commit `f01a5d1`: `feat(27-03): tune FSB badge for mobile WCAG 2.5.5 hit-area`
- PASS: `npx tsc --noEmit -p .` produced no errors (empty stderr, exit 0)
- PASS: `useMediaQuery('(min-width: 768px)')` literal present in fsb-control-overlay.tsx
- PASS: `isDesktop ? <div className="fsb-control-grid"` literal present in fsb-control-overlay.tsx
- PASS: `Phase 27 breakpoint reconciliation` comment block present in fsb-control-overlay.tsx
- PASS: `min-width: 220px` literal present in globals.css (base rule)
- PASS: `@media (max-width: 47.99rem)` block present in globals.css
- PASS: `min-height: 44px` literal present in globals.css (mobile rule)
- PASS: `padding: 12px 16px` literal present in globals.css (mobile rule)
- PASS: `font-size: 11px` literal present in globals.css (mobile rule)
- PASS: `padding: 8px 12px` REMOVED from globals.css (0 matches)
- PASS: `font-size: 9px` REMOVED from globals.css (0 matches)
- PASS: `Phase 27` comments present in globals.css (2 occurrences — one in base rule, one in mobile rule)
- PASS: existing `@media (max-width: 37.5rem)` block still contains `.fsb-control-corners` and `.fsb-control-target` overrides (NOT removed)

## Next Phase Readiness

- FSB-05 mobile overlay treatment is live. Mobile DevTools at 375px viewport should show no scan grid, a larger 11px-font badge with >= 44px min-height, and an unchanged tap-through behavior to underlying portfolio content.
- The 600-768px in-between zone (corners use desktop 24px inset, grid hidden, badge already at mobile size) is the documented compromise per UI-SPEC. Future visual regression tests at 700px should expect this hybrid state.
- Plan 27 wave 3 is complete. The phase has no further plans; verification should now exercise both FSB-04 (caption state machine, Plan 27-02) and FSB-05 (mobile treatment, this plan) end-to-end on desktop + mobile viewports.
- Pixel-identical desktop guardrail (Phase 23 baseline) preserved: only additive properties (`min-width`, `text-align`, `box-sizing`) added to the base badge rule; no existing properties modified, removed, or reordered. Visual diff against `e2a1383` (Phase 23 HEAD reference per UI-SPEC) at >= 768px should show zero pixel changes in the idle state.

---
*Phase: 27-fsb-overlay-polish*
*Completed: 2026-04-26*
