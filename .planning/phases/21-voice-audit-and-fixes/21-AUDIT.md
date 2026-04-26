# Voice Feature Audit

**Date:** 2026-04-26
**Branch:** `nextjs` @ `740da4a`
**Scope:** "Ask Parz" voice mode — STT (ElevenLabs Scribe v2 + Web Speech fallback) → AI loop (xAI Grok via streamText) → TTS (ElevenLabs Turbo v2.5 + SpeechSynthesis fallback) → tool dispatch (navigate / openProject / scrollTo / closeBrowser / openCurrentProjectExternal / unsupportedIframeControl / toggleTheme / openLink / startTour / switchToText / endCall).
**Method:** Three parallel codebase explorations, then direct re-read of every cited line. False positives from the initial sweep have been removed.
**Out of scope:** Text chat (`useChat` from `@ai-sdk/react` — SSE parsing is correct there), DataGrid / particle background / FSB overlay / transitions.

---

## 1. Executive Summary

The voice pipeline is architecturally sound and the security posture is correct (server-side keys, voice-ID allowlist, 500-char TTS cap, single-use STT tokens). What's broken is a small set of pipeline defects in `src/lib/voice-controller.ts` that the user will hit in normal use:

1. **Tool calls are silently dropped** when the `/api/chat` SSE stream flushes mid-JSON — the manual reader splits each chunk on `\n` with no leftover buffer (P0).
2. **The site tour audio overlaps itself** at start because `startTour()` is fire-and-forget while a "Sure, starting the tour" reply is still being spoken (P0).
3. **Barge-in is mathematically impossible** for `prefers-reduced-motion` users: the level is clamped to 0.2 but compared against `> 0.35` (P0, accessibility regression).
4. **Space bar is hijacked globally** while voice is active, including inside text inputs — typing in any field eats the spaces (P0).
5. Several edge-case hangs and stale-callback issues (P1) plus polish items (P2/P3) listed below.

Recommended fix order: **P0 first (~1.5h), P1 next (~2h), defer P2/P3**. None of the fixes are architectural; all are localised.

---

## 2. Voice Pipeline (with defect markers)

```
              ┌──────────────────────────────────────────────────────┐
              │                  useVoiceController                  │
              │            (src/lib/voice-controller.ts)              │
              └──────────────────────────────────────────────────────┘
                       │
   open() / Space ─────┤
                       ▼
              ┌─────────────────┐    /api/stt-token                 ┌────────────────┐
              │  startListening │ ────────────────────▶              │  ElevenLabs    │
              │  (Scribe v2)    │ ◀──── 15-min token ────            │   Scribe SDK   │
              └─────────────────┘                                    └────────────────┘
                       │  COMMITTED_TRANSCRIPT
                       ▼
              ┌─────────────────┐                                      ┌────────────────┐
              │ handleUserTurn  │ ──── POST /api/chat (SSE) ───────▶   │  xAI Grok      │
              │                 │                                      │  streamText    │
              │  ◀── DEFECT 1: ── chunk.split('\n') drops boundary ──▶ │  + tools       │
              └─────────────────┘                                      └────────────────┘
                       │           assistantText  +  toolCalls[]
                       ├──────────────────────────────────────┐
                       │                                       │
                       ▼                                       ▼
              ┌─────────────────┐                     ┌─────────────────┐
              │  dispatchToolCall  ◀── DEFECT 9:       │  speak(clean)   │
              │  (per-tool emit)   ─── unwrapped throws └─────────────────┘
              │                                                 │
              │   ◀── DEFECT 2:  startTour() not awaited ──▶    │
              │                  (overlaps speak above)         │
              └─────────────────┘                               ▼
                                                       ┌─────────────────┐
                                                       │   streamTTS     │ ── /api/tts ──▶ ElevenLabs Turbo v2.5
                                                       │   ◀── DEFECT 7: ─ SpeechSynth fallback no timeout
                                                       └─────────────────┘
                                                                │
                                                                ▼
                                                       ┌─────────────────┐
                                                       │ VoiceBus level  │ ── DEFECT 3: cap=0.2 vs threshold=0.35 ─▶ barge-in dead
                                                       │     loop        │
                                                       └─────────────────┘

Outside this loop, two more user-visible defects:
  • DEFECT 4 (Space hijack) — keydown handler in useVoiceController
  • DEFECT 5 (openTextChat 400 ms race) — voice-session-provider.tsx
```

---

## 3. Findings

### P0 — User-visible breakage (fix first)

#### F-01 — SSE chunk-boundary parser drops tool calls and text deltas
- **File:** `src/lib/voice-controller.ts:404-436`
- **Symptom:** Parz says "Sure, opening Parz-AI" but the iframe never opens. Or text response prints partially. Behaviour is intermittent and correlates with network speed / chunk size.
- **Root cause:** The manual SSE reader does:
  ```ts
  const chunk = decoder.decode(value, { stream: true });
  const lines = chunk.split('\n');
  for (const line of lines) {
    if (line.startsWith('data: ')) { ... try { JSON.parse(payload) } catch {} }
  }
  ```
  No `leftover` buffer between iterations. When a `data: {...}` event spans two reads (which happens whenever the server flushes mid-payload or the network breaks the chunk), the front half ends up in iteration N as an incomplete line; the back half arrives in iteration N+1 missing its `data: ` prefix. Both `JSON.parse` calls fail inside the swallowed `try/catch`. The whole event vanishes silently. Tool calls are the most visible casualty because they tend to be the longest payloads.
- **Fix sketch:**
  ```ts
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';   // keep the incomplete trailing line
    for (const line of lines) { /* same as today */ }
  }
  // flush any trailing line on done if needed
  ```
- **Why text chat isn't affected:** `chat-popup.tsx` and `chat/page.tsx` use `useChat` from `@ai-sdk/react`, which parses with `DefaultChatTransport` (proper streaming parser). Only the voice path rolls its own.

#### F-02 — `startTour()` is fire-and-forget; greeting TTS overlaps `TOUR_STEPS[0].say`
- **File:** `src/lib/voice-controller.ts:476-478` (dispatch) and `:493-494` (trailing speak)
- **Symptom:** Asking for a tour produces a brief moment of two voices on top of each other.
- **Root cause:** `case 'startTour': startTour(); break;` lacks `await`. `startTour` immediately calls `goPage(step.page)` and then `await speak(step.say)`. Meanwhile the outer `handleUserTurn` falls through to `if (clean) await speak(clean)` (the "Sure, starting the tour" line). Both `streamTTS` calls hit `window.VoiceBus._getCtx()` and start concurrent BufferSources.
- **Fix sketch:**
  ```ts
  case 'startTour':
    if (clean) await speak(clean);   // greeting first, fully
    await startTour();
    return;
  ```

#### F-03 — Barge-in is mathematically dead under `prefers-reduced-motion`
- **File:** `src/lib/voice-controller.ts:669-677`
- **Symptom:** Users with reduce-motion enabled cannot interrupt Parz; the only way to stop a long answer is to click the stop/close button.
- **Root cause:**
  ```ts
  const effectiveLevel = prefersReduced ? Math.min(level, 0.2) : level;
  if (window.VoiceBus.state === 'speaking' && effectiveLevel > 0.35) bargeIn();
  ```
  If `prefersReduced` is true, `effectiveLevel` is clamped at 0.2, which can never exceed the 0.35 threshold.
- **Fix sketch:** scale the threshold with the cap, e.g.
  ```ts
  const threshold = prefersReduced ? 0.15 : 0.35;
  if (window.VoiceBus.state === 'speaking' && effectiveLevel > threshold) bargeIn();
  ```
- **Bonus:** add a 300-500 ms debounce on the bargeIn call to prevent multiple `startListening()` racers when level hovers near threshold.

#### F-04 — Space bar hijacked globally while voice is active
- **File:** `src/lib/voice-controller.ts:711-715`
- **Symptom:** With voice mode on, typing "hello world" anywhere on the site comes out "helloworld". This breaks the fallback text-chat input (the user can switch to text but still has voice "active" until close).
- **Root cause:** `handleKeyDown` calls `e.preventDefault()` on every Space, regardless of `e.target`.
- **Fix sketch:**
  ```ts
  const tag = (e.target as HTMLElement | null)?.tagName;
  const editable = (e.target as HTMLElement | null)?.isContentEditable;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || editable) return;
  if (e.code === 'Space' && window.VoiceBus.state !== 'listening') {
    e.preventDefault();
    void startListening();
  }
  ```

---

### P1 — Edge cases / resilience (fix after P0)

#### F-05 — `openTextChat` 400 ms timing race with View Transitions (~500 ms)
- **File:** `src/providers/voice-session-provider.tsx:82-90`
- **Symptom:** "switch to text" from Portfolio/About sometimes opens an empty / non-focused chat popup.
- **Root cause:** The provider hardcodes `setTimeout(..., 400)` then dispatches `parz:open-text-chat`. View Transitions API typically takes ~500 ms to mount the new page; on slower hardware or first paint, the listener inside ChatPopup hasn't subscribed when the event fires.
- **Fix sketch:** subscribe to `VoiceBus.on('page-ready', page => { if (page === 'home') dispatchEvent(...) })` instead of a fixed delay. The home page already emits `page-ready` (used by `waitForPage`).

#### F-06 — STT `SESSION_STARTED` has no timeout
- **File:** `src/lib/voice-controller.ts:594-651`
- **Symptom:** "Listening…" forever, mic light never turns on. Reproducible if Scribe accepts the connection but stalls before emitting any event.
- **Root cause:** `Scribe.connect()` returns a connection; the mic is only attached inside `connection.on(SESSION_STARTED, ...)`. There is no timeout to fall back to Web Speech or surface an error. `RealtimeEvents.ERROR` covers explicit failures but not silent hangs.
- **Fix sketch:**
  ```ts
  const sessionTimeout = setTimeout(() => {
    if (window.VoiceBus.state === 'listening' && !sessionStarted) {
      try { connection.close(); } catch {}
      setCaption('Switching to backup speech…');
      startListeningFallback();
    }
  }, 5000);
  connection.on(RealtimeEvents.SESSION_STARTED, () => { sessionStarted = true; clearTimeout(sessionTimeout); ... });
  // also clearTimeout in CLOSE / ERROR / catch
  ```

#### F-07 — SpeechSynthesis fallback has no timeout
- **File:** `src/lib/voice-controller.ts:286-314`
- **Symptom:** State stuck on `speaking`, UI stops responding. Reproducible on Safari with engine disabled or autoplay policy violation.
- **Root cause:** `synth.speak(u)` can silently no-op (no `error` event, no `end` event). The `u.onerror` handler exists but doesn't catch the no-op case.
- **Fix sketch:** add a worst-case timeout proportional to text length, ~50 ms/char + 1s floor:
  ```ts
  const guardMs = Math.max(1000, text.length * 50);
  const guard = setTimeout(() => { try { u.onend?.(new Event('timeout') as any); } catch {} }, guardMs);
  u.onend = () => { clearTimeout(guard); ... };
  u.onerror = () => { clearTimeout(guard); ... };
  ```

#### F-08 — `registerToolCallbacks` accumulates stale references
- **File:** `src/providers/voice-session-provider.tsx:43-45`
- **Symptom:** After visiting `/portfolio` then returning to `/`, voice tool dispatch may invoke handlers bound to unmounted state; results are usually no-ops but can throw.
- **Root cause:** `registerToolCallbacks` only ever spreads in new entries — never removes. Pages have no clean way to unregister on unmount.
- **Fix sketch:** return a deregister function:
  ```ts
  const registerToolCallbacks = useCallback((callbacks: ToolCallbacks) => {
    Object.assign(toolCallbacksRef.current, callbacks);
    return () => {
      for (const k of Object.keys(callbacks)) delete toolCallbacksRef.current[k as keyof ToolCallbacks];
    };
  }, []);
  ```
  Pages then do `useEffect(() => registerToolCallbacks({...}), [...])`.

#### F-09 — Tool callback exceptions are not wrapped
- **File:** `src/lib/voice-controller.ts:115-196` (every `case` in `dispatchToolCall`)
- **Symptom:** A synchronous `throw` inside any `toolCallbacks.X()` (e.g. portfolio resolver throwing for an unknown alias) bubbles up; `tool-error` glow never fires; the voice loop aborts mid-turn.
- **Root cause:** Every case calls the callback bare:
  ```ts
  const result = toolCallbacks.openProject(args as { slug: string });
  window.VoiceBus.emit(result?.ok === false ? 'tool-error' : 'tool-success');
  ```
- **Fix sketch:** factor a small helper:
  ```ts
  const runTool = (name: string, fn: () => ControlResult | void) => {
    window.VoiceBus.emit('tool-executing');
    try {
      const result = fn();
      window.VoiceBus.emit(result?.ok === false ? 'tool-error' : 'tool-success');
    } catch (err) {
      console.error(`[VoiceController] ${name} threw:`, err);
      window.VoiceBus.emit('tool-error');
    }
  };
  ```

---

### P2 — Polish / resilience (defer)

#### F-10 — `_getCtx().resume()` not awaited
- **File:** `src/lib/voice-bus-init.ts:69-71`
- **Detail:** First `decodeAudioData` after a user gesture can land on a still-suspended context. The implicit promise chain in `streamTTS` masks this most of the time, but on cold start it can manifest as a missed first syllable.
- **Fix:** make `_getCtx` async or accept the racy resume and assert state before scheduling the source.

#### F-11 — `keyup` on Space closes any active connection unconditionally
- **File:** `src/lib/voice-controller.ts:721-726`
- **Detail:** A stray Space release (e.g. user tapped Space in another app, came back) closes the active STT connection even if listening was started by mic-button click rather than Space-down.
- **Fix:** track an `isSpaceDown` flag set in `keydown`, only close on `keyup` if it's true.

#### F-12 — `/api/stt-token` has no rate limiting / caching
- **File:** `src/app/api/stt-token/route.ts:8-19`
- **Detail:** Each call mints a fresh single-use token. Easy to abuse with a refresh loop.
- **Fix:** simple in-memory IP throttle (e.g. 10/min) + maybe a 60-second cached token reused while it's still valid.

#### F-13 — `/api/tts` has no upstream timeout, unsafe cast
- **File:** `src/app/api/tts/route.ts:42-50`
- **Detail:** `audioStream as ReadableStream` will explode at runtime if the SDK returns `null` / non-stream. A hung ElevenLabs request keeps the route open forever.
- **Fix:** `Promise.race` with a 10–15 s timeout; runtime-check the stream before `new Response(...)`.

#### F-14 — Message id via `Math.random().toString(36).slice(2)`
- **File:** `src/lib/voice-controller.ts:380`
- **Detail:** Cosmetic only — collision risk is negligible. `crypto.randomUUID()` is free and clearer.

---

### P3 — Cosmetic / docs

#### F-15 — Stale comment about barge-in threshold
- **File:** `src/lib/voice-controller.ts:665`
- **Detail:** Comment says "When speaking and energy > 0.15, cancel TTS" but code uses `> 0.35`. Update comment when fixing F-03.

#### F-16 — `.env.example` missing `ELEVENLABS_API_KEY`
- **File:** `.env.example`
- **Detail:** The primary template (`cp .env.example .env.local`) only documents `XAI_API_KEY`. The full set is in `.env.local.example`, but a fresh contributor following the README-style instructions will skip TTS/STT setup. Add `ELEVENLABS_API_KEY=your_elevenlabs_key_here` with a one-line comment pointing to the dashboard.

#### F-17 — `public/pcm-processor.js` is dead code
- **File:** `public/pcm-processor.js`
- **Detail:** No `audioWorklet.addModule(...)` call references it. Scribe SDK handles its own PCM internally. Confirm with the user, then delete.

---

## 4. False Positives (do **not** action)

| Item | Why it's NOT a bug |
|------|---------------------|
| "API keys committed to repo" | `.env.local` is **not** tracked. `git ls-files` shows only `.env.example` and `.env.local.example` (placeholders). No rotation needed. |
| "Tool arg `name` vs `slug` mismatch" | `voice-controller.ts:454-456` renames Grok's `args.name` to `{slug}` before dispatch; `voice-session-provider.tsx:57-59` reads `{slug}` and forwards to `siteControl.openProject(slug)`. Confusing but functionally correct. |
| "openProject Zod schema mismatch" | Schema says `name`, controller uses `name` from Grok, only the local-IPC contract uses `slug`. No mismatch. |
| "AI SDK key order in tool dedup" | Speculative — xAI emits stable order in practice. Not worth defensive code. |

---

## 5. Recommended Fix Order

| Wave | Items | Estimated effort |
|------|-------|------------------|
| **Wave 1 (P0)** | F-01, F-02, F-03, F-04 | ~1.5 h. All inside `voice-controller.ts`, all small. Ship together. |
| **Wave 2 (P1)** | F-05, F-06, F-07, F-08, F-09 | ~2 h. Touches `voice-controller.ts` + `voice-session-provider.tsx`. F-09 should land before F-08 because the wrap helps catch fallout from the registration churn. |
| **Wave 3 (P2)** | F-10..F-14 | Defer. Address opportunistically. |
| **Wave 4 (P3)** | F-15..F-17 | Defer. Bundle into next docs/cleanup pass. |

For each wave, suggested verification:
- Run `pnpm test` (Vitest) — existing eval suite covers persona/site-control contracts.
- Run `pnpm test:e2e` (Playwright on port 3100) — covers project resolution and navigation.
- Manual smoke: open voice, do the repro of every fixed finding, watch the browser console for `tool-executing` / `tool-success` / `tool-error` event traces.

---

## 6. What's Working / Not Broken

This was a real audit, so it's worth saying clearly what passed:

- **Security posture**: Both API keys are server-only. The TTS voice ID is hard-allowlisted at `dMWVPH9DSxWOMrrrUso3`; the route silently rewrites any client override. The text input is clamped to 500 chars before reaching ElevenLabs. STT tokens are single-use 15-minute issuance. `.env.local` is not tracked.
- **Architecture**: Provider stack (`ThemeProvider → TransitionProvider → VoiceBusProvider → SiteControlProvider → VoiceSessionProvider`) is clean. `window.VoiceBus` global with namespaced events is the right shape — keeps the controller decoupled from React state.
- **Persona / system prompt** (`src/data/system-prompt.ts`, `public-profile.ts`): Public-safe, voice-mode prefix is in place ("under 2 sentences, no markdown, no lists, no emoji"), guardrails on internal/private categories are explicit.
- **FSB control overlay**: `runWithControlOverlay` in `site-control-provider.tsx` does the right thing — overlay shows immediately, action runs, overlay hides on a timer. No findings here.
- **Iframe browser path** (Phase 17): Project resolution via `resolveProject` + alias map is sound; `openProject` returns a proper `ControlResult { ok, message }`.
- **Fallback chains**: STT primary→Web Speech and TTS primary→SpeechSynthesis exist and are wired correctly. The two timeout gaps (F-06, F-07) are the only remaining holes.
- **Persistence**: Rolling 20-message history → `localStorage('pf-voice-history')` save-on-close / load-on-mount. Multi-tab race is theoretical and acceptable for a portfolio.
- **Chat path** (text): `useChat` + `DefaultChatTransport` is the canonical Vercel AI SDK setup. SSE parsing here is correct (the F-01 bug is voice-only).

---

## 7. Repro Steps for Each P0 Finding

| # | Repro |
|---|-------|
| F-01 | DevTools → Network → throttle to "Slow 3G" → Voice → "open Parz-AI". The assistant text streams, but the `tool-input-available` event for `openProject` is sometimes split across reads and dropped — assistant says "opening Parz-AI" but no iframe. Repeat 5-10× to observe variance. |
| F-02 | Voice → "give me a tour". Listen to the first ~2 seconds: the "Sure, starting the tour" sentence overlaps `TOUR_STEPS[0].say`. |
| F-03 | macOS System Settings → Accessibility → Display → check "Reduce motion". Reload, voice → "tell me a long story about your work". Speak loudly mid-answer — Parz keeps talking. |
| F-04 | Voice on, click "switch to text chat" but don't close voice. In the chat input, type `hello world` — comes out `helloworld`. |
| F-05 | Voice on `/portfolio` → "switch to text chat". On a slow first paint (cold reload, devtools throttle), ChatPopup may not autofocus or may be empty. Retry with a hot cache and it usually works. |
| F-06 | Local proxy `/api/stt-token` to `sleep 60` (or stub a token that Scribe rejects without firing ERROR). UI sticks on "Listening…" indefinitely. |

---

## 8. Files Touched by Recommended Fixes (preview)

| File | Findings |
|------|----------|
| `src/lib/voice-controller.ts` | F-01, F-02, F-03, F-04, F-06, F-07, F-09, F-11, F-14, F-15 |
| `src/providers/voice-session-provider.tsx` | F-05, F-08 |
| `src/lib/voice-bus-init.ts` | F-10 |
| `src/app/api/tts/route.ts` | F-13 |
| `src/app/api/stt-token/route.ts` | F-12 |
| `.env.example` | F-16 |
| `public/pcm-processor.js` | F-17 (delete) |

---

*End of audit. Awaiting decision on fix scope.*
