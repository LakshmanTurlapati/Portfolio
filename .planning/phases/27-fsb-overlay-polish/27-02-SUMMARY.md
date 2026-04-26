---
phase: 27-fsb-overlay-polish
plan: 02
subsystem: ui
tags: [fsb, overlay, voice-bus, captions, accessibility, react]

# Dependency graph
requires:
  - phase: 27-fsb-overlay-polish
    provides: tool-executing-payload (Plan 27-01: { name, args })
provides:
  - fsb-overlay-caption-state-machine
  - per-tool-caption-resolver
  - sr-caption-mirror
  - extended-overlay-hide-window
affects: [fsb-control-overlay.tsx, site-control-provider.tsx]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - voice-bus-event-subscription-with-cleanup
    - cross-fade-state-machine-with-reduced-motion-fallback
    - text-only-caption-rendering (T-27-03 mitigation)

key-files:
  created: []
  modified:
    - src/components/fsb-control-overlay.tsx
    - src/providers/site-control-provider.tsx

key-decisions:
  - "Caption resolver returns null for unknown tool names (fallback to IDLE_TEXT, never render args)"
  - "openProject caption uses resolveProject(slug).name; falls back to slug if resolver misses"
  - "scrollTo, openLink, toggleTheme, closeBrowser, openCurrentProjectExternal use generic captions (no args interpolation) per CONTEXT-27"
  - "navigate caption interpolates args.page directly (route slug: portfolio/about/home)"
  - "Cross-fade implemented as opacity 1 -> 0 (200ms ease-in) -> swap text -> opacity 0 -> 1 (200ms ease-out)"
  - "prefers-reduced-motion short-circuits the cross-fade to instant text swap (no opacity transition style)"
  - "Single-slot timer refs (hideTimerRef, fadeTimerRef) — rapid-fire tool-executing cancels pending hold/fade"
  - "Overlay hide timer extended 900ms -> 3500ms (3000ms error hold + 200ms fade + 300ms margin)"
  - "Did NOT modify globals.css (Plan 27-03 owns CSS edits to avoid wave-2 file conflict)"

patterns-established:
  - "VoiceBus event subscriber pattern with payload narrowing in components: cast raw to ToolExecutingPayload, validate name is string before reading args"
  - "Caption-to-SR-text helper: lowercase first char (preserves embedded uppercase like 'FSB'), strip trailing U+2026, append period"
  - "Module-scope constants for animation timing (SUCCESS_HOLD_MS, ERROR_HOLD_MS, FADE_MS) instead of magic numbers"

requirements-completed: [FSB-04]

# Metrics
duration: 2 min
completed: 2026-04-26
---

# Phase 27 Plan 02: FSB Overlay Caption State Machine Summary

**Context-aware action captions in the FSB badge driven by VoiceBus tool-executing/success/error events, with 1500ms success / 3000ms error holds, 200ms cross-fade, sr-only mirror, and an extended 3500ms overlay hide window so caption timers play out fully.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-26T23:54:08Z
- **Completed:** 2026-04-26T23:56:09Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- FSB control overlay now reads VoiceBus `tool-executing` payloads (`{ name, args }`) and renders one of seven locked captions while a tool runs, holding it 1500ms after success / 3000ms after error before cross-fading back to `powered by FSB`.
- `openProject` caption resolves the args slug into the human project name via `resolveProject` (e.g. `OPENING FSB / FULL SELF BROWSING…`), with a defensive fallback to the slug if the resolver misses.
- Screen-reader status mirrors the active caption (`Parz is opening FSB / Full Self Browsing.`) and reverts to `Parz is controlling the site.` on idle.
- `prefers-reduced-motion: reduce` short-circuits the 200ms cross-fade to an instant text swap.
- All caption timers clear on component unmount; rapid-fire tool calls cancel any pending success/error hold (latest event wins).
- Overlay hide timer in `site-control-provider.runWithControlOverlay` extended from 900ms to 3500ms so the caption state machine actually finishes inside the visible overlay.

## Task Commits

Each task was committed atomically:

1. **Task 1: Build caption state machine + per-tool resolver in fsb-control-overlay.tsx** — `34080c9` (feat)
2. **Task 2: Reconcile site-control-provider overlay lifetime with caption timers** — `b670680` (fix)

## Files Created/Modified

- `src/components/fsb-control-overlay.tsx` — Rewritten from a 36-line static badge into a caption-aware component: VoiceBus subscriptions with cleanup, per-tool caption resolver, single-slot timer state machine, cross-fade rendering with reduced-motion fallback, and a synchronized sr-only status mirror. Visual structure (`fsb-control-overlay`, `fsb-control-grid`, `fsb-control-corners`, `fsb-control-target`, `fsb-control-badge`) preserved unchanged so the existing `globals.css` styling carries over (idle desktop pixel-identical to Phase 19/23 baseline).
- `src/providers/site-control-provider.tsx` — Single timer literal change inside `runWithControlOverlay` from 900ms to 3500ms, with an inline Phase 27 / FSB-04 comment explaining the math (3000ms error hold + 200ms fade + 300ms margin). Clear-on-reentry behavior at line 81 and the unmount cleanup useEffect retained as-is so rapid-fire tool calls do not accumulate stale 3500ms timers.

## Decisions Made

1. **Unknown tool name → null caption → IDLE_TEXT fallback.** `resolveCaption` returns null for any name not in the seven-tool table. The component renders `IDLE_TEXT` when the caption state is null, so `unsupportedIframeControl` and any future unmapped tool name will never leak args into the badge. (T-27-04 mitigation.)
2. **Caption rendered as React text children only.** The badge JSX uses `{renderText}` directly. No `dangerouslySetInnerHTML`, no template injection. Model-supplied `args.slug` and `args.page` only ever appear inside ordinary string interpolation that React escapes. (T-27-03 mitigation.)
3. **Single-slot timer refs.** `hideTimerRef` and `fadeTimerRef` each hold at most one timer ID. `clearTimers()` runs on every new `tool-executing`, on every `tool-success`/`tool-error` (via `scheduleReturnToIdle`), and inside the useEffect cleanup. (T-27-05 mitigation.)
4. **Cross-fade implementation: opacity 1 → 0 → swap text → opacity 0 → 1.** Two-phase: timer fires after `holdMs`, sets `visible=false` (200ms fade-out), then a second timer at `FADE_MS` swaps caption to null and sets `visible=true` (200ms fade-in). Total state-to-idle ≈ 400ms, matching UI-SPEC's "cross-fade through opacity 0 step".
5. **`reducedMotionRef` captured once at mount.** Per voice-controller convention, we read `matchMedia('(prefers-reduced-motion: reduce)').matches` in a one-shot `useEffect` and store on a ref. Switching the OS-level preference mid-session doesn't re-render — acceptable per UI-SPEC (no requirement to live-track the media query).
6. **Did NOT touch `globals.css`.** The PLAN explicitly defers CSS edits (badge `min-width`, mobile sizing) to Plan 27-03 to keep wave-2 plans on disjoint files.
7. **Did NOT add `'use client'`** — already present at the top of the existing file.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None. Both edits were surgical, type-checked cleanly on the first attempt, and pass every grep-based acceptance check.

## User Setup Required

None — no external service configuration required.

## Threat Surface

No new attack surface introduced. T-27-03 / T-27-04 / T-27-05 mitigations are in place:

- **T-27-03 (XSS in caption):** `dangerouslySetInnerHTML` is absent. Caption renders as React text children only. (Verified by `grep dangerouslySetInnerHTML\\s*=` returning zero matches.)
- **T-27-04 (unknown tool args leak):** Unknown tool names short-circuit to IDLE_TEXT before `args` is read.
- **T-27-05 (timer accumulation DoS):** Single-slot timer refs with `clearTimers()` on every event and on unmount.
- **T-27-06 (repudiation):** Accepted — caption is ephemeral UI state with no audit need.

No threat flags raised: no new network endpoints, no new auth paths, no new file access patterns, no new schema changes.

## Self-Check: PASSED

- FOUND: `src/components/fsb-control-overlay.tsx` (modified)
- FOUND: `src/providers/site-control-provider.tsx` (modified)
- FOUND commit `34080c9`: `feat(27-02): add caption state machine to FSB control overlay`
- FOUND commit `b670680`: `fix(27-02): extend control overlay hide timer to 3500ms for caption holds`
- PASS: `npx tsc --noEmit -p .` exits 0 (zero TypeScript errors)
- PASS: 3 `VoiceBus.on('tool-(executing|success|error)'` subscriptions present
- PASS: 7 caption strings present in source (Opening, Scrolling, Closing browser, Switching theme, Opening link, Opening externally, Navigating to)
- PASS: `resolveProject` imported and called in openProject branch
- PASS: 1500 / 3000 hold constants present
- PASS: 2 `clearTimeout` calls in cleanup helper
- PASS: 0 `dangerouslySetInnerHTML` usages
- PASS: 1 `}, 3500);` literal in `site-control-provider.tsx`
- PASS: 0 `}, 900);` literal in `site-control-provider.tsx` (old timer fully removed)
- PASS: `Phase 27` comment present above the new setTimeout

## Next Phase Readiness

- FSB-04 caption state machine is live and ready for the manual smoke checks documented in the PLAN (open FSB, go to portfolio, switch theme — verify badge text and SR status update correctly).
- The badge's CSS `min-width` is unchanged in this plan — long captions like `NAVIGATING TO PORTFOLIO…` may grow the badge horizontally until Plan 27-03 lands, which owns globals.css edits including the recommended `min-width: 220px` desktop / `180px` mobile.
- Plan 27-03 will also wire mobile-tuned overlay treatment (FSB-05): hide grid below 768px, enlarge badge for 44px touch target. It modifies `fsb-control-overlay.tsx` (mobile gating) and `globals.css` — no caption-logic conflict expected.

---
*Phase: 27-fsb-overlay-polish*
*Completed: 2026-04-26*
