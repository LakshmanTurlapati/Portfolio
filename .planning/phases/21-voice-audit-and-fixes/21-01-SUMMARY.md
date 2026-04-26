---
phase: 21
plan: 01
subsystem: voice
tags: [audit, voice, stt, tts, sse, accessibility, tour]
key-files:
  - src/lib/voice-commands.ts
  - src/lib/voice-controller.ts
  - src/app/api/chat/route.ts
  - src/app/about/page.tsx
  - src/app/portfolio/page.tsx
  - .planning/phases/21-voice-audit-and-fixes/21-AUDIT.md
metrics:
  audit_findings: 17
  p0_fixes_shipped: 4
  hardcoded_triggers_remaining: 1
  vitest_tests: 12
---

# Plan 21-01 Summary: Voice Audit, Tour Rip-out, and Wave 1 P0 Fixes

## What Changed

### Audit deliverable
- Produced `21-AUDIT.md` with 17 findings categorized P0 (4) / P1 (5) / P2 (5) / P3 (3) plus a false-positives section.
- Each finding cites `file:line` against `nextjs` branch HEAD and includes a fix sketch and repro steps.

### Tour redesign — no more hardcoded triggers
- Slimmed `src/lib/voice-commands.ts` to a single export, `isStopIntent`. Removed `TOUR_STEPS`, `matchNavIntent`, `isTourIntent`, `isTextModeIntent`, and the `TourStep` / `NavIntent` types. They were dead code (only `isStopIntent` was actually imported), and the user explicitly asked for AI-driven walkthroughs.
- Removed the `startTour` tool definition from `siteControlTools` in `src/app/api/chat/route.ts`. Replaced its instruction line with a "Tour / walkthrough behavior" guidance block: the LLM drives tours one step at a time via existing `navigate` / `openProject` / `scrollTo` calls, paced by user input.
- Removed `startTour`, `waitForPage`, the `case 'startTour':` switch arm, and the `TOUR_STEPS` import from `src/lib/voice-controller.ts`. Cleaned up the now-stale `eslint-disable react-hooks/exhaustive-deps` directive.
- Updated `src/app/about/page.tsx` and `src/app/portfolio/page.tsx` comments — page-ready emissions stay (Wave 2 will reuse them for the openTextChat race fix), but the comments no longer reference the removed `waitForPage`.

### Wave 1 P0 fixes
| ID  | Fix                                                                                                                  | File                          |
|-----|----------------------------------------------------------------------------------------------------------------------|-------------------------------|
| F-01 | SSE reader keeps a `leftover` buffer between reads — JSON events that span chunk boundaries no longer drop tool calls. | `voice-controller.ts:362-402` |
| F-02 | Obsoleted by the tour rip-out (no `startTour()` to await anymore).                                                   | n/a                           |
| F-03 | Barge-in threshold scales with the `prefers-reduced-motion` level cap: `0.15` reduced / `0.35` default.               | `voice-controller.ts:631-644` |
| F-04 | Space `keydown`/`keyup` skip when target is `INPUT`/`TEXTAREA`/`contenteditable`. Typing spaces while voice is active works again. | `voice-controller.ts:670-699` |

## Verification

| Command | Result |
|---------|--------|
| `npx tsc --noEmit` | Clean (no output) |
| `npx vitest run` | 12/12 tests pass across 2 files |
| `npx next build` | Succeeds, all 12 routes generated |
| `npx next lint` | Only pre-existing warnings (none new from this phase's edits) |
| `grep -RnE 'TOUR_STEPS\|startTour\|matchNavIntent\|isTourIntent\|isTextModeIntent\|waitForPage\|TourStep\|NavIntent' src/` | No matches |

## Deviations

- The audit was produced before the plan file. Phase 21 was filed retroactively because the user authorized direct edits with "continue the wave in autonomous mode". Plan and summary describe the work as it actually happened.
- F-02 was on the original P0 list but is structurally obsoleted by the tour rip-out — there is no `startTour()` to fire-and-forget anymore. Counted as resolved; no separate code change.
- Wave 2 (P1: STT/TTS timeouts, callback registration, exception wrapping, openTextChat 400ms race) is not in this phase. Tracked in `21-AUDIT.md` for a future phase.
- Phase 21 adds no new requirements to the milestone — it is audit-driven bug-fix work against existing voice behavior.

## Self-Check

PASSED. The hardcoded tour is gone; the only remaining hardcoded trigger in the voice path is `isStopIntent` (justified: instant abort without network round-trip). The four P0 audit findings either have shipped fixes or were structurally obsoleted. Typecheck, tests, and build are green.
