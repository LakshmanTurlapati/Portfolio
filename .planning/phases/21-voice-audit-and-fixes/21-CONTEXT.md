# Phase 21: Voice Audit and Wave 1 Fixes - Context

**Gathered:** 2026-04-26
**Status:** Retroactive — work was performed off-roadmap and is being filed back into the milestone after the fact.

<domain>
## Phase Boundary

Phase 21 is a follow-on to v4.0/v4.1 voice work. After v4.1 phases 16-20 shipped, the user reported that the voice ("Ask Parz") feature was "broken on other levels" and asked for a full audit. This phase covers:

1. The audit itself — three parallel codebase explorations followed by direct source verification, producing `21-AUDIT.md` with 17 findings categorized P0–P3.
2. Removing the hardcoded tour scaffolding (`TOUR_STEPS`, `startTour`, `waitForPage`, the `startTour` chat tool) so the LLM drives walkthroughs entirely through existing tool calls.
3. Wave 1 P0 fixes from the audit: SSE chunk-boundary buffer, `prefers-reduced-motion` barge-in threshold, Space-bar hijack guard. (Original P0 item F-02 was obsoleted by the tour rip-out — no `startTour()` to await anymore.)

Phase 21 explicitly does NOT cover:
- Wave 2 (P1) and beyond — STT/TTS timeouts, callback registration churn, exception wrapping, openTextChat 400ms race. Those defer to a future phase.
- Live API smoke testing (still tracked under deferred API-03).
- Any new user-visible features. This is bug-fix and instrumentation work.

</domain>

<decisions>
## Implementation Decisions

### Tour redesign
- **No hardcoded tour script.** The previous design hardcoded a 5-step `TOUR_STEPS` array plus a special `startTour` tool. The user explicitly asked for AI-driven tours — "no hardcoded triggers". The tour now runs through normal `navigate` / `openProject` / `scrollTo` tool calls one step at a time, paced by user input.
- **Tour guidance lives in chat-route instructions.** Added a "Tour / walkthrough behavior" section to `siteControlToolInstructions` in `src/app/api/chat/route.ts`. The LLM is told to do one step per turn and let the user say "next" / ask questions to advance.
- **`isStopIntent` is the only remaining hardcoded trigger.** Stop detection stays local because instant abort without a network round-trip is a safety/UX requirement. `matchNavIntent`, `isTourIntent`, `isTextModeIntent` were dead code (never imported) and were removed.

### P0 fix selection
- **F-01 (SSE buffer):** swapped the bare `chunk.split('\n')` reader for a stream-aware buffer that keeps the trailing incomplete line between reads. Tool calls and text deltas that span chunk boundaries are no longer dropped.
- **F-02 (startTour overlap):** obsoleted by the tour rip-out. There is no `startTour()` left to fire-and-forget.
- **F-03 (barge-in vs prefers-reduced-motion):** the level cap (0.2) was less than the threshold (0.35), making barge-in mathematically impossible for a11y users. Threshold now scales with the cap: `0.15` reduced / `0.35` default.
- **F-04 (Space hijack):** keydown/keyup now skip when `e.target` is `INPUT`, `TEXTAREA`, or `contenteditable`. Voice can stay open while the user types in fallback chat.

### Page-ready emissions stay
- `src/app/about/page.tsx` and `src/app/portfolio/page.tsx` still emit `VoiceBus.emit('page-ready', name)` on mount. The original `waitForPage` consumer is gone, but the emissions are reused in Wave 2 to fix the openTextChat 400ms race (F-05). Comments updated to drop the stale "tour" wording.

### Verification approach
- Reuse the Phase 20 contract suite — no new tests written this phase. The audit is text-only, the tour rip-out is covered transitively (existing tests assert chat-route tool surface, dead `startTour` references would fail typecheck), and the four P0 fixes are localized changes that were verified with typecheck + vitest + next build + targeted grep.

### Claude's discretion
- The phase was retroactively filed because the user explicitly authorized off-roadmap edits ("continue the wave in autonomous mode"). The artifacts here describe what was actually done; they were not written upfront.

</decisions>

<code_context>
## Existing code insights

- `src/lib/voice-controller.ts` (~750 lines) holds the entire voice state machine. Tour code (`startTour`, `waitForPage`, the `case 'startTour':` switch arm) was contiguous and removed cleanly.
- `src/lib/voice-commands.ts` was a regex grab-bag from the v4.0 port. Most of it was already dead code by the time Grok started owning intent routing; this phase trimmed it to the single live function (`isStopIntent`).
- `src/app/api/chat/route.ts` exposes 11 tools to the LLM via `siteControlTools`. Phase 21 drops `startTour` (10 tools remain) and replaces its tool-instruction line with a "Tour / walkthrough behavior" guidance block.
- `useChat` from `@ai-sdk/react` (used by `chat-popup` and `/chat` page) parses SSE via `DefaultChatTransport` correctly. Only the manual SSE reader inside `voice-controller.handleUserTurn` had the F-01 bug.
- The Phase 20 `tests/parz-contracts.test.ts` and `tests/project-resolution.test.ts` continue to pass unchanged, confirming no persona/safety regression.

</code_context>
