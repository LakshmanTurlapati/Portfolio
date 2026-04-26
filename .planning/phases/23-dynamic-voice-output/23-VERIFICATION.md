---
phase: 23
status: passed
verified_at: 2026-04-26T01:15:00.000Z
---

# Phase 23 Verification

## Result

status: passed (pending live-deploy smoke verification)

Phase 23 satisfies its goal: every word the user hears is LLM-generated; the three hardcoded `speak()` calls are gone; the Phase-22 R-1 barge-in regression that silenced all TTS is fixed.

## Goal Coverage

| Goal element | Evidence | Status |
|--------------|----------|--------|
| H-1 — greet generated dynamically | `open()` calls `handleUserTurn(trigger, { kind: 'greet' })`; no greet string literals remain | Passed |
| H-2 — empty-response silence | `else if (toolCalls.length === 0)` branch sets state to idle and clears caption (no `speak`) | Passed |
| H-3 — server-error caption | `catch` branch sets state to idle and surfaces UI caption (no `speak`) | Passed |
| R-1 — barge-in regression | `_liveAudio` guard added to barge-in `useEffect` so phantom default-level emissions no longer trigger self-abort | Passed |
| `handleUserTurn` `kind` semantics | Greet: skips history push, skips stop-intent, appends synthetic trigger to messages; user: unchanged | Passed |
| No string-literal `speak()` arguments | `grep -nE 'speak\("[^"]+"\)' src/lib/voice-controller.ts` returns no matches | Passed |
| Only remaining hardcoded trigger in voice | `isStopIntent` (instant abort, no network round-trip) | Passed (justified) |

## Commands Run

| Command | Result |
|---------|--------|
| `npx tsc --noEmit` | Clean (no output) |
| `npx vitest run` | 2 files / 12 tests passed |
| `npx next build` | Production build succeeded; 12 routes generated |
| `npx next lint --dir src` | Pre-existing warnings only; no new warnings on `voice-controller.ts` |
| `grep -nE 'speak\("[^"]+"\)' src/lib/voice-controller.ts` | Empty |
| `curl -X POST https://portfolio-v4-test.fly.dev/api/tts ...` | 200 + valid MP3 (server-side healthy pre-fix; confirms R-1 was client-side) |

## Human Verification (post-deploy)

After redeploying with `fly deploy --remote-only`, test on `https://portfolio-v4-test.fly.dev/`:

1. **R-1 fixed (TTS plays at all):** open voice. Audible greet plays. (Pre-fix: silent every turn.)
2. **H-1 (LLM greet varies):** open voice on `/`, then close + reopen. Then on `/portfolio`, then `/about`. Each greet should vary slightly — LLM picks the words. Same page, repeated open: should also vary.
3. **H-2 (empty-response silence):** trigger an utterance Grok responds to with only a tool call (e.g., "open Parz-AI"). Tool fires, navigation happens, no speech if there's no text accompanying it. (Hard to reproduce deterministically since the system prompt asks the LLM to always speak alongside tools.)
4. **H-3 (server-error caption):** in DevTools, block `/api/chat`. Try to talk. UI should show `Server hiccup — try again.` and fall to idle silently — no audio. (To revert: unblock the route.)
5. **Barge-in still works on real audio:** open voice → ask for a long answer → speak loudly mid-answer. Parz should stop on real-amplitude barge-in. The `_liveAudio` guard does not break this — analyser readings during TTS playback set `_liveAudio = true`.

## Deferred

- Wave-2 P1 audit findings still open in `21-AUDIT.md`: F-05 (openTextChat 400ms race), F-06 (STT session-started timeout), F-07 (SpeechSynthesis timeout), F-08 (registerToolCallbacks deregister), F-09 (tool callback try/catch). Not in scope for Phase 23.
- Migrating UI captions ("Thinking…", "Listening…", error messages) to dynamic strings is out of scope — UI labels, not voice output.
