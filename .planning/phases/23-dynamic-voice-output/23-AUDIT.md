# Hardcoded-Speech Audit (post-Phase 22)

**Date:** 2026-04-26
**Branch:** `nextjs` @ post-Phase-22
**Trigger:** User asked to confirm "no hardcoded greetings... absolutely nothing hardcoded. Everything is generated dynamically."
**Method:** `grep -nE 'speak\(|setCaption\('` over `src/lib/voice-controller.ts` and inspection of every match.

---

## Verdict (pre-fix)

**False.** Three user-facing speech strings still bypass the LLM, AND a Phase-22 regression silently broke ALL TTS playback on the deployed test portfolio. Items listed below with line numbers from the post-Phase-22 file.

| ID | Line | Code | When it fires | Severity |
|----|------|------|---------------|----------|
| H-1 | 738 | `speak("Hey, I'm Parz. I can give you a tour, or just chat. What are we doing?")` (home) / `speak("Parz here. Ask me anything, or say take me home.")` (other pages) | Every time voice opens (the audible one) | High — every session |
| H-2 | 539 | `await speak("Hmm, I lost my train of thought.")` | Grok returns no text and no tool calls (degenerate) | Low — rare |
| H-3 | 542 | `await speak("My server's glitching. Give me a sec and try again.")` | `/api/chat` itself errors (network / 500 / no key) | Low — rare |
| **R-1** | 715 | barge-in subscriber fires on phantom default level when `setState('speaking')` runs before any analyser starts | **Every TTS turn — Parz never plays audio at all** | **CRITICAL — production-breaking** |

### R-1 — Phase-22 regression (production hotfix)

**Symptom (user-reported):** "I cannot hear anything... mic is working but the speech isn't working." All TTS output silenced on the deployed test portfolio.

**Root cause:**
1. `streamTTS` calls `VoiceBus.setState('speaking')` BEFORE the `/api/tts` fetch completes — to update UI state immediately.
2. `setState()` checks `_liveAudio` (false at this moment — no analyser yet) and emits a fallback default level of **0.75** for the `'speaking'` state.
3. The barge-in subscriber checks `state === 'speaking' && effectiveLevel > 0.35` → **0.75 > 0.35 = true** → calls `bargeIn()`.
4. `bargeIn()` calls `cancelAllAudio()` (Phase 22 helper).
5. `cancelAllAudio()` calls `speakAbortRef.current?.abort()` — **this is what Phase 22 added** — which aborts the in-flight `/api/tts` fetch.
6. The `.then` chain checks `ac.signal.aborted` and bails silently.
7. Result: Parz never speaks. Every. Single. Turn.

**Why this didn't manifest pre-Phase-22:** `bargeIn()` only stopped `audioSourceRef.current` (which was null at this moment in the trace) and called `_stopLoop()` (no-op — `_raf` was null). The fetch had no AbortController, so it kept running, audio eventually played in `'listening'` state. The bug existed but had a workaround. Phase 22's stricter cancellation (AbortController) made the failure complete and visible.

**Fix:** Gate the barge-in check on `_liveAudio === true`, so it only reacts to actual analyser RMS readings, not to phantom default levels emitted by `setState`.

```ts
if (
  window.VoiceBus._liveAudio &&            // <-- new guard
  window.VoiceBus.state === 'speaking' &&
  effectiveLevel > threshold
) {
  bargeIn();
}
```

`_liveAudio` is set to `true` only by `_startLoop()` and `attachTTSFake()`, and reset to `false` by `_stopLoop()`. State-default level emissions don't touch it, so they no longer trigger barge-in.

## What is NOT a hardcoded speech (out of scope)

The user said "everything generated dynamically." I read this as referring to **what the user hears**. These string literals stay:

- **UI captions** (`'Thinking…'`, `'Listening…'`, `'Mic access denied. Click to retry.'`, `'Speech recognition isn't available...'`, `'Mic error: '`, `'Couldn't start mic: '`) — these are on-screen text labels showing system state, not voice output. Removing them would leave the UI illegible.
- **`voiceInstruction` system-prompt prefix** (`'Keep replies under 2 sentences. ...'`) — sent to the LLM as instructions, not played as audio.
- **Tour / walkthrough behavior block** in `siteControlToolInstructions` — sent to the LLM as guidance, not played as audio.
- **System prompt** in `src/data/system-prompt.ts` — defines persona, not user-facing speech.

A future iteration could turn the "Server hiccup" caption (added in this phase) into a dynamic UI string too, but UI labels weren't what the user asked about.

---

## Fix Strategy

Three changes, all in `src/lib/voice-controller.ts`:

### H-1 — LLM-generated greet
- Add `kind: 'user' | 'greet'` option to `handleUserTurn`. Default `'user'` keeps every existing call site behaviorally identical.
- When `kind === 'greet'`:
  - Skip pushing the trigger to `historyRef` (synthetic, not the user's words).
  - Build messages from history + a one-shot synthetic trigger appended at the end.
  - Skip the `isStopIntent` early-return.
  - Append the LLM's response to history (so subsequent turns know Parz already greeted).
- Replace `open()`'s `speak(greetMessage)` with:
  ```ts
  const trigger = `[Voice mode just opened on the ${page} page. Greet briefly and offer help — under 2 sentences, voice channel: no markdown, no lists, no emoji.]`;
  void handleUserTurn(trigger, { kind: 'greet' });
  ```
- Keep the 480ms morph-settle timer and the three Phase-22 guards.

### H-2 — empty-response silence
- Replace the `else if (toolCalls.length === 0) { await speak("Hmm…"); }` branch with `setState('idle'); setCaption('')`. If the LLM has nothing to say, we say nothing.

### H-3 — server-error caption
- Replace the catch-block `await speak("My server's glitching…")` with `setState('idle'); setCaption('Server hiccup — try again.')`. UI text, no audio. The LLM is unreachable in this branch by definition.

---

## Why this is the right fit for "everything dynamic"

The synthetic greet trigger phrase IS a hardcoded prompt — but the user never hears it. They hear whatever the LLM chooses to say, which varies turn-to-turn and page-to-page. From the user's perspective, every word Parz speaks is now generated dynamically. That matches the spirit of the request.
