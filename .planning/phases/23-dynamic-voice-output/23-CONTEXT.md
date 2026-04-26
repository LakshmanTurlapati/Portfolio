# Phase 23: Dynamic Voice Output - Context

**Gathered:** 2026-04-26
**Status:** Audit-driven follow-on to Phase 21/22.

<domain>
## Phase Boundary

Phase 23 makes Parz's voice output 100% LLM-generated. The user explicitly asked: "no hardcoded greetings... absolutely nothing hardcoded. Everything is generated dynamically." A grep audit (`23-AUDIT.md`) found three user-facing speech strings that bypassed the LLM:

- **H-1:** `open()` greet (the audible one — fires every open)
- **H-2:** empty-response fallback (rare — Grok returns no text, no tools)
- **H-3:** server-error fallback (rare — `/api/chat` itself is broken)

Phase 23 closes all three. The greet becomes a real LLM turn driven by a synthetic kickoff trigger; the two emergency fallbacks become silent (UI captions stay).

Phase 23 explicitly does NOT cover:
- UI captions (on-screen labels, not voice output) — they stay.
- Persona / system-prompt content changes — out of scope.
- Wave-2 P1 audit findings (F-05 / F-06 / F-07 / F-08 / F-09) still tracked in `21-AUDIT.md` for a future phase.

</domain>

<decisions>
## Implementation Decisions

### One refactor, two deletions
- The greet path piggybacks on `handleUserTurn` via a new optional `kind` arg, instead of a separate `sendGreet` function. Reuses the SSE parser, tool dispatch, turn-generation guard, audio-cancellation entry, and `speak` flow — all of which Phase 21/22 already hardened.
- The two emergency fallbacks (H-2, H-3) are deleted, not replaced. Silence is the dynamic answer when the LLM has nothing to say — and when the LLM is unreachable, we can't ask it for words anyway.

### `kind: 'user' | 'greet'` semantics
- `'user'` (default): unchanged. Utterance is a real user transcription; appended to history; goes through `isStopIntent`.
- `'greet'`: synthetic kickoff. NOT appended to history (the user never said it). The LLM's response IS appended (next turn has context that Parz greeted). Skips `isStopIntent` (a greet trigger is never a stop).

### Synthetic trigger phrasing
- `[Voice mode just opened on the {page} page. Greet briefly and offer help — under 2 sentences, voice channel: no markdown, no lists, no emoji.]`
- Square brackets signal "this is a system instruction, not a user message" without needing a special protocol.
- Page name is interpolated so the LLM can tailor the greet ("ready to walk through the portfolio?" vs "want the human story?").
- The voice-channel constraints are restated in the trigger because we deliberately do NOT feed it through the existing `voiceInstruction` prefix (the prefix only attaches to the `utterance` match, and on greet that match is the trigger itself — adding the prefix would double-instruct).

### Empty-response silence (H-2)
- The branch `else if (toolCalls.length === 0)` only fires when the LLM has neither text nor tools — a degenerate response shape. Hardcoded apology was a "safe noise" pattern. With this phase: silence + idle state. Acceptable trade-off for the user's "nothing hardcoded" requirement.

### Server-error caption (H-3)
- The catch block runs when `/api/chat` itself errors. We have no LLM to ask. Two options:
  - Stay completely silent (could leave user wondering if anything happened).
  - Show an on-screen caption.
- Chose caption (`'Server hiccup — try again.'`). It's UI text, not speech, so it fits the "everything spoken is dynamic" rule. Caption was already used for similar mic-error states elsewhere.

### Turn generation participation
- Greet turns use the same `turnGenerationRef.current` increment as user turns. So if the user push-to-talks while a greet is mid-flight, the greet bails at the post-SSE checkpoint and the user's utterance wins. No special-case logic needed.

### Caption during greet
- We still set `'Thinking…'` while the greet fetch is in flight. It's a state label, not an apology. UI is consistent with user-turn behavior.

### Verification approach
- Reuse existing test suite. The hardcoded strings weren't asserted by any test (verified by grep). Manual smoke checks listed in `23-VERIFICATION.md`.

### Claude's discretion
- Trigger phrasing (length, bracket convention).
- Whether to extract a shared `chatTurn` helper from `handleUserTurn` (decided no — `kind` arg is smaller and the duplication doesn't yet justify a refactor).

</decisions>

<code_context>
## Existing code insights

- `handleUserTurn` already does all the heavy lifting: STT close, audio cancel, turn-gen bump, fetch, SSE parse with leftover buffer (Phase 21 F-01), stale-turn checkpoint (Phase 22), tool dispatch, speak. Adding `kind` is the smallest possible extension.
- `cancelAllAudio` (Phase 22) preempts any in-flight TTS, so the greet's `speak` cleanly replaces a prior speak with no overlap.
- `turnGenerationRef` (Phase 22) means the greet turn participates in the same generation system — a fast user "barge-in talk" before greet finishes will preempt cleanly.
- `setCaption` is already used for both transient state ("Thinking…") and persistent error messages ("Mic error: foo"). Adding `'Server hiccup — try again.'` is consistent with that pattern.
- The Phase 20 contract suite (`tests/parz-contracts.test.ts`, `tests/project-resolution.test.ts`) does not test any string from `voice-controller.ts`. Verified by grep.

</code_context>
