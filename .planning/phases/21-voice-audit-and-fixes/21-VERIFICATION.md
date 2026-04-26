---
phase: 21
status: passed
verified_at: 2026-04-26T00:25:00.000Z
---

# Phase 21 Verification

## Result

status: passed

Phase 21 satisfies its goal: voice pipeline audited end-to-end (17 findings filed), tour scaffolding ripped out so the LLM drives walkthroughs entirely through existing tool calls, and the four P0 user-visible bugs from the audit are either shipped or structurally obsoleted.

## Goal Coverage

| Goal element | Evidence | Status |
|--------------|----------|--------|
| Audit deliverable exists | `21-AUDIT.md` — 17 findings, per-finding `file:line`, repro steps, false-positives section | Passed |
| No hardcoded tour | `grep -RnE 'TOUR_STEPS\|startTour\|matchNavIntent\|isTourIntent\|isTextModeIntent\|waitForPage\|TourStep\|NavIntent' src/` returns no matches | Passed |
| LLM-driven tour guidance in place | "Tour / walkthrough behavior" paragraph in `siteControlToolInstructions` (`src/app/api/chat/route.ts`) | Passed |
| Only `isStopIntent` remains hardcoded | `src/lib/voice-commands.ts` exports a single function `isStopIntent` | Passed |
| F-01 SSE buffer fix | `src/lib/voice-controller.ts` reader maintains `let buffer = ''`, pops trailing incomplete line, flushes on `done` | Passed |
| F-02 tour-overlap | Obsoleted by the tour rip-out — no `startTour()` to fire-and-forget | Passed (structural) |
| F-03 barge-in vs prefers-reduced-motion | Threshold scales with cap: `0.15` reduced / `0.35` default | Passed |
| F-04 Space hijack | `isTypingTarget` helper guards both `keydown` and `keyup` | Passed |

## Commands Run

| Command | Result |
|---------|--------|
| `npx tsc --noEmit` | Clean (no output) |
| `npx vitest run` | 2 files / 12 tests passed |
| `npx next build` | Production build succeeded; 12 routes generated |
| `npx next lint` | Pre-existing warnings only (none new from this phase) |
| `grep -RnE '<tour-tokens>' src/` | No matches |

## Human Verification

The four P0 fixes have user-observable behavior changes; manual spot-checks recommended after the next deploy:

1. **F-01 (SSE buffer):** open voice → "open Parz-AI" with DevTools throttling at "Slow 3G". Tool call should always fire (previously dropped intermittently).
2. **F-03 (a11y barge-in):** OS → enable reduce motion → open voice → ask for a long answer → speak loudly mid-answer. Parz should now stop on barge-in (previously would not).
3. **F-04 (Space hijack):** open voice → click "switch to text chat" → type `hello world` in the input. Spaces should appear (previously eaten).

Tour behavior (no hardcoded script):
4. Open voice → "give me a tour". Parz should pick a starting page, narrate one stop, then stop and wait for "next" or a question. Walking the user through the site one step per turn — no scripted 5-step playback.

None of these block phase completion; they are post-deploy smoke checks.

## Deferred

Wave 2 (P1) and beyond from `21-AUDIT.md` are out of scope for Phase 21. Specifically: F-05 (openTextChat 400ms race), F-06 (STT session-started timeout), F-07 (SpeechSynthesis timeout), F-08 (registerToolCallbacks deregister), F-09 (tool callback try/catch), and the P2/P3 polish items.
