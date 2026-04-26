# Phase 25: Voice Wave 2 Hardening - Research

**Researched:** 2026-04-26
**Domain:** Voice mode reliability — timer guards, event-driven coordination, callback lifecycle, exception isolation
**Confidence:** HIGH (all decisions locked in CONTEXT.md; investigation confirmed implementation paths against current code)

## Summary

Phase 25 closes five P1 voice findings (F-05..09) from `21-AUDIT.md` Wave 2. All five are surgical edits to two files (`src/providers/voice-session-provider.tsx`, `src/lib/voice-controller.ts`) plus a single new emission in `src/providers/transition-provider.tsx`. CONTEXT.md locks every architectural choice, so the research load is to confirm clean implementation paths and surface integration pitfalls — not debate alternatives.

Key confirmation from the codebase audit:
1. The `page-ready` VoiceBus event already exists — `/portfolio` and `/about` emit it on mount today, but `/` does NOT, which is exactly why a 400 ms `setTimeout` papers over the gap. Centralizing emission in `transition-provider` after `transition.finished` is the correct fix; the existing `useEffect` emissions on portfolio/about can stay (idempotent for the one-shot listener).
2. `registerToolCallbacks` is currently exposed but **not consumed by any page** — the deregister return contract is purely additive; no migration needed.
3. `dispatchToolCall` already emits `tool-executing` / `tool-success` / `tool-error` per case — `runTool` is a refactor that consolidates the existing pattern + adds try/catch, not a new emission scheme. FSB-04 (Phase 27) consumes the existing event names, so emit shape stays stable.
4. `cancelAllAudio` (line 214) already aborts fetches and stops audio sources — adding timer-ref cleanup follows the existing `try { ... } catch {}` pattern with no new abstractions.

**Primary recommendation:** Implement in the order F-09 → F-08 → F-05 → F-06 → F-07 (matching audit's recommended ordering — `runTool` first so it catches any fallout from the registration churn, then plumb the rest). Every fix uses identity-checked refs / generation counters that are already established patterns in the file (Phase 22).

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Voice Timing & Timeouts (VOICE-05/06/07)

- **VOICE-05 page-ready event**: Emit a VoiceBus `page-ready` event from `transition-provider` once the post-View-Transition pathname matches the navigation target. `openTextChat` listens with a one-shot subscription plus a 1500 ms safety timeout (falls back to existing 400 ms behavior). On fire (event or timeout), dispatch `parz:open-text-chat`.
- **VOICE-06 Scribe stall timeout**: Fixed 5000 ms guard armed when calling `connection.start()`, cleared on `SESSION_STARTED`. On fire → close the Scribe socket, fall back to Web Speech path, and surface the caption "Speech service slow — switching to fallback".
- **VOICE-07 Synth fallback worst-case timeout**: `Math.max(1000, text.length * 50)` ms with a hard cap of 30000 ms. On fire → invoke `finishSynth()` and `synth.cancel()` so the queue drains.
- **Timer cleanup**: Track all guard timer refs and clear them inside `cancelAllAudio` to prevent stale fires after a cancel.

#### Tool Callback Contract (VOICE-08/09)

- **VOICE-08 deregister return shape**: `registerToolCallbacks(callbacks)` returns a `() => void` that deletes exactly the keys that were registered (captured from `Object.keys(callbacks)` at registration time). Consumers call it from a `useEffect` cleanup. Provider-owned defaults (`toggleTheme`, `openLink`, `openProject`, etc.) remain untouched.
- **VOICE-08 dispatcher behavior on missing handler**: Preserve existing semantics — `console.warn` + emit `tool-error`. No behavior change to the missing-handler path.
- **VOICE-09 `runTool()` signature**: `runTool(name, fn)` where `fn: () => unknown | Promise<unknown>`. Emits `tool-executing` before invocation, awaits if a Promise is returned, emits `tool-success` on resolve / `tool-error` on throw or rejection. Returns the unwrapped result so callers can inspect `.ok`.
- **VOICE-09 missing-handler emission**: `runTool` only wraps callback invocations; the missing-handler path still emits only `tool-error` (no `tool-executing`).

### Claude's Discretion

- Exact placement of the `page-ready` emitter inside `transition-provider` (post-callback hook vs `useEffect` keyed on pathname) — pick whichever cleanly mirrors existing transition completion semantics.
- Caption phrasing for VOICE-06 fallback may be tightened in implementation if a shorter form reads better in the existing caption UI.
- Whether to extract `runTool` into `voice-controller.ts` body or a small helper module — local file unless a clear test boundary emerges.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed inside Wave 2 scope. Wave 3+ voice findings, new voice tools, and any architectural rewrites stay out of v4.2.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VOICE-05 | Replace 400 ms `setTimeout` race in `voice-session-provider.tsx:82` with VoiceBus `page-ready` listener | Existing `page-ready` emission on `/portfolio` and `/about`; `/` does NOT emit (gap confirmed). Centralize emission in `transition-provider` so all routes covered. One-shot listener + 1500 ms safety timer covers slow paint and View Transitions API failure modes. |
| VOICE-06 | Add 5 s guard at `voice-controller.ts:693` (Scribe SESSION_STARTED) | Audit fix sketch confirmed against actual code: `Scribe.connect()` returns a connection (line 679); `SESSION_STARTED` handler is at line 693. Arm timer immediately after connect, clear in handler. ERROR/CLOSE/AUTH_ERROR handlers must also clear timer to prevent stale fires. Cleanup must compose with `cancelAllAudio`. |
| VOICE-07 | Add `Math.max(1000, text.length * 50)` ms timeout to SpeechSynthesis fallback at `voice-controller.ts:343` | Synth path begins at line 343 inside the `.catch` of streamTTS. `finishSynth` already exists (line 350). Adding a guard timer cleared by `u.onend`/`u.onerror` (which both call `finishSynth`) is a 6-line edit. 30000 ms cap prevents pathological text length from creating huge timers. |
| VOICE-08 | Change `registerToolCallbacks` return type from `void` to `() => void` (deregister fn) | Currently no consumer (audit confirmed); change is purely additive. Capture `Object.keys(callbacks)` at registration time so deregister deletes exactly the registered keys, not whatever happens to be in the ref later. Provider-owned defaults set in `useEffect` (lines 50-66) are untouched. |
| VOICE-09 | Factor `runTool(name, fn)` helper at `voice-controller.ts:125` | Current `dispatchToolCall` repeats the same `tool-executing → fn() → tool-success/error` pattern across 7 cases. `runTool` consolidates to one place + adds try/catch. Existing event names (`tool-executing`, `tool-success`, `tool-error`) are unchanged — Phase 27 (FSB-04) subscribes to these names. |
</phase_requirements>

## Standard Stack

No new dependencies. All edits use existing primitives.

| Primitive | Source | Use For |
|-----------|--------|---------|
| `useRef` for timer IDs | React 19 | All guard timers (VOICE-05/06/07) follow `audioSourceRef` / `speakAbortRef` identity-check pattern from Phase 22 |
| `setTimeout` / `clearTimeout` | Browser | Standard — no AbortController needed for these timers since they're cleared via direct ref tracking |
| `window.VoiceBus.on(evt, fn)` | `voice-bus-init.ts` | Returns an unsubscribe function — already used elsewhere in the file. One-shot wrapper is `const unsub = on(...); fn(...); unsub();` |
| `useCallback` cleanup contract | React 19 | Returning `() => void` from `registerToolCallbacks` works with `useEffect(() => register({...}), [])` — React calls returned cleanup on unmount |

**Verification:**
- `@elevenlabs/client@^1.3.1` is the version pinned in `package.json` [VERIFIED: package.json:18]. `RealtimeEvents.SESSION_STARTED`, `PARTIAL_TRANSCRIPT`, `COMMITTED_TRANSCRIPT`, `AUTH_ERROR`, `ERROR`, `CLOSE` are all already wired (line 693-729) [VERIFIED: voice-controller.ts:693-729]. No new SDK surface needed for VOICE-06.
- React 19.1.0, Next.js 15.5.14 [VERIFIED: package.json:25, 22] — strict-mode double-mount is in scope (see Pitfalls).

## Architecture Patterns

### Pattern 1: Identity-checked guard timer (Phase 22 reuse)

```typescript
// VOICE-06 — Scribe stall guard
const sessionGuardRef = useRef<ReturnType<typeof setTimeout> | null>(null);

const startListening = useCallback(async () => {
  // ... existing code ...
  const connection = Scribe.connect({ /* ... */ });

  // Arm the guard immediately after connect — covers the silent-stall window
  sessionGuardRef.current = setTimeout(() => {
    // Identity check: only fire if THIS guard ref is still current
    if (sessionGuardRef.current === null) return;
    sessionGuardRef.current = null;
    try { connection.close(); } catch {}
    setCaption('Speech service slow — switching to fallback');
    startListeningFallback();
  }, 5000);

  connection.on(RealtimeEvents.SESSION_STARTED, () => {
    // Clear on success
    if (sessionGuardRef.current !== null) {
      clearTimeout(sessionGuardRef.current);
      sessionGuardRef.current = null;
    }
    // ... existing attachMic logic ...
  });

  // Also clear in ERROR / AUTH_ERROR / CLOSE / catch — see Pitfall 2
}, [/* ... */]);
```

**Why ref-tracked:** Same pattern as `audioSourceRef`, `speakAbortRef`, `speechUtteranceRef`. Lets `cancelAllAudio` reach in and clear the timer without coupling to the closure that armed it.

### Pattern 2: One-shot VoiceBus listener with safety fallback

```typescript
// VOICE-05 — openTextChat coordination
const openTextChat = useCallback((_initialText?: string) => {
  goPage('home');

  let fired = false;
  const fire = () => {
    if (fired) return;
    fired = true;
    unsub();
    clearTimeout(safetyTimer);
    window.dispatchEvent(new CustomEvent('parz:open-text-chat'));
  };

  // Subscribe BEFORE the safety timer so we can't miss a synchronous emit
  const unsub = window.VoiceBus.on('page-ready', (page) => {
    if (page === 'home') fire();
  });

  // Fallback: existing 400ms behavior is the floor; 1500ms is the ceiling
  // for cases where View Transitions never resolves or page-ready is somehow missed
  const safetyTimer = setTimeout(fire, 1500);
}, [goPage]);
```

**Important:** `fired` flag is critical — both the listener AND the timer can fire. Without the gate the popup gets opened twice (no-op visually but emits two events).

### Pattern 3: `runTool` factor in voice-controller

```typescript
// VOICE-09 — wrap every callback invocation
const runTool = (name: string, fn: () => unknown): { ok: boolean } => {
  if (typeof window === 'undefined' || !window.VoiceBus) {
    try { fn(); return { ok: true }; } catch { return { ok: false }; }
  }
  window.VoiceBus.emit('tool-executing');
  try {
    const result = fn();
    if (result && typeof (result as Promise<unknown>).then === 'function') {
      // Async — resolve outcome on settle
      (result as Promise<unknown>).then(
        (r) => {
          const ok = !(r && typeof r === 'object' && 'ok' in (r as object) && (r as { ok: boolean }).ok === false);
          window.VoiceBus.emit(ok ? 'tool-success' : 'tool-error');
        },
        (err) => {
          console.error(`[VoiceController] ${name} rejected:`, err);
          window.VoiceBus.emit('tool-error');
        }
      );
      return { ok: true }; // Optimistic — caller sees ok until promise rejects
    }
    const ok = !(result && typeof result === 'object' && 'ok' in (result as object) && (result as { ok: boolean }).ok === false);
    window.VoiceBus.emit(ok ? 'tool-success' : 'tool-error');
    return { ok };
  } catch (err) {
    console.error(`[VoiceController] ${name} threw:`, err);
    window.VoiceBus.emit('tool-error');
    return { ok: false };
  }
};
```

**dispatchToolCall consolidation** — every `case` in `dispatchToolCall` becomes:
```typescript
case 'openProject':
  if (toolCallbacks?.openProject) {
    runTool('openProject', () => toolCallbacks.openProject!(args as { slug: string }));
  } else {
    console.warn('[VoiceController] openProject tool called but no toolCallbacks.openProject provided');
    window.VoiceBus.emit('tool-error'); // Missing-handler path: no tool-executing
  }
  break;
```

The missing-handler branch keeps its `console.warn` + raw `tool-error` emit (no `tool-executing`) — exactly preserves current behavior per CONTEXT decision.

### Pattern 4: Deregister contract for `registerToolCallbacks`

```typescript
const registerToolCallbacks = useCallback((callbacks: ToolCallbacks): (() => void) => {
  // Capture keys at registration time — NOT later. If the consumer mutates the
  // callbacks object after handing it in, the deregister fn still removes only
  // the keys that were originally added.
  const ownedKeys = Object.keys(callbacks) as (keyof ToolCallbacks)[];
  Object.assign(toolCallbacksRef.current, callbacks);

  return () => {
    for (const k of ownedKeys) {
      delete toolCallbacksRef.current[k];
    }
  };
}, []);
```

**Consumer pattern:**
```typescript
useEffect(() => {
  return registerToolCallbacks({ /* ... */ });
}, [registerToolCallbacks, /* deps */]);
```

### Anti-Patterns to Avoid

- **Do NOT use `setTimeout(unsub, 0)` to delay the `page-ready` subscription** — emission happens in a `useEffect` on the destination page mount, which is async relative to `goPage`. The listener must be attached synchronously inside `openTextChat` so it's live before the new page mounts.
- **Do NOT clear the Scribe guard inside `CLOSE`-only path** — `CLOSE` fires on the `connection.close()` we call ourselves when the guard fires. That's a re-entrancy loop. Clear in `SESSION_STARTED` (success), `AUTH_ERROR`, `ERROR`, and the outer `catch` (token fetch fail). On the guard's own fire path, set the ref to `null` BEFORE calling `connection.close()`.
- **Do NOT capture `toolCallbacks` reference in the deregister closure** — it's a parameter, but if the consumer's render cycle creates a new object each render, the deregister still must operate on the original keys. Capture `Object.keys(callbacks)` into a `const ownedKeys` array at registration, then iterate that.
- **Do NOT wrap `navigate` and `endCall` cases in `runTool`** — they're internal-only (`goPage(...)` and `setActive(false)` respectively); they don't have `toolCallbacks.X` consumers and don't need `tool-executing` semantics. Leave them bare.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cross-tab/component event coordination | Custom EventTarget bridge | Existing `window.VoiceBus.on/emit` | Already initialized at module scope (`voice-bus-init.ts`), already wraps listener Sets, already exception-safes inside `emit` (try/catch around each handler) |
| Promise / sync union dispatch | Custom `isPromise` library | `typeof result?.then === 'function'` | Standard duck-typing — works for native Promises and AI-SDK return values uniformly |
| Async cancellation token | New cancellation abstraction | Existing `speakAbortRef` AbortController + `turnGenerationRef` counter pattern | Phase 22 already standardized this. New timers compose with `cancelAllAudio` via direct ref clearing |
| One-shot listener helper | Wrapper utility | Inline `let fired = false; const unsub = on(...); ... unsub()` | Three-line pattern; not worth extracting given single use site |

**Key insight:** Every Wave 2 fix maps to a primitive that already exists in the file. The Phase 22 audio-serialization vocabulary (refs + identity checks + AbortController + generation counters) covers timers natively.

## Common Pitfalls

### Pitfall 1: View Transitions API + `transition.finished` semantics
**What goes wrong:** Emitting `page-ready` from `transition-provider` looks straightforward, but `transition.finished` resolves AFTER the new DOM is committed AND the animation completes. The new page's `useEffect` mount fires at COMMIT time, BEFORE animation completes — so emitting on `transition.finished` arrives later than the destination page's own emit.
**Why it happens:** `document.startViewTransition(callback)` runs the callback synchronously to capture old/new states; `transition.ready` resolves when the pseudo-elements are mounted (post-callback); `transition.finished` resolves after animation. The destination page's `useEffect` runs between `ready` and `finished`.
**How to avoid:** Emit `page-ready` after `transition.finished` settles (success path) AND in the `.catch` of `transition.ready` (transition-aborted fallback). Even if the destination page already emitted, the one-shot listener's `fired` gate makes a second emit a no-op. Also keep the existing per-page emits — they cover the case where `transition-provider` is bypassed (e.g., direct URL load, browser back without `popstate` interception).
**Warning signs:** Listener fires twice in dev tools — that's fine if `fired` gate is in place; if you see `parz:open-text-chat` dispatched twice, the gate is missing.

### Pitfall 2: Scribe guard timer cleanup must compose with `cancelAllAudio`
**What goes wrong:** User clicks "Stop" while Scribe is connecting → `cancelAllAudio` runs, but the 5 s guard is still armed; 4 s later it fires `startListeningFallback()` on a closed session, re-attaching mic.
**Why it happens:** `cancelAllAudio` (line 214) doesn't currently know about timers — only audio sources, abort controllers, and resolvers.
**How to avoid:** Add timer refs (`sessionGuardRef`, `synthGuardRef`) to `cancelAllAudio` cleanup. Pattern: `if (sessionGuardRef.current) { clearTimeout(sessionGuardRef.current); sessionGuardRef.current = null; }`. Both directions: guard clears itself when firing AND `cancelAllAudio` clears it externally.
**Warning signs:** "Listening…" reappears 5 s after pressing close, or `tool-error` glow fires on a session that's already torn down.

### Pitfall 3: SpeechSynthesis `onend`/`onerror` race with timeout guard
**What goes wrong:** Native `onend` fires AND the guard timer fires → `finishSynth` called twice. Second call mutates state on a different utterance (because `speechUtteranceRef.current` was cleared by the first call's identity check, but a NEW utterance from the next turn might be assigned by then), or stomps the new turn's `speakResolverRef`.
**Why it happens:** `synth.cancel()` is technically idempotent, but `finishSynth`'s state writes (`window.VoiceBus.setState('idle')`, `setCaption('')`, `speakResolverRef.current = null`) run unconditionally after the identity check.
**How to avoid:** Pattern for the guard:
```typescript
const synthGuardRef = useRef<ReturnType<typeof setTimeout> | null>(null);
const guardMs = Math.min(30000, Math.max(1000, text.length * 50));
synthGuardRef.current = setTimeout(() => {
  synthGuardRef.current = null;
  try { synth.cancel(); } catch {}
  finishSynth(); // existing finishSynth identity-checks speechUtteranceRef
}, guardMs);
const originalOnEnd = u.onend;
u.onend = (e) => {
  if (synthGuardRef.current) { clearTimeout(synthGuardRef.current); synthGuardRef.current = null; }
  originalOnEnd?.call(u, e);
};
// Same wrapping for u.onerror
```
The existing `finishSynth` identity check (`speechUtteranceRef.current === u`) is the safety net — second call no-ops on state mutation.
**Warning signs:** Caption clears mid-speech of the next turn, or `voiceState` flips to `idle` after Parz starts speaking the next response.

### Pitfall 4: React 19 strict-mode double-mount + `registerToolCallbacks`
**What goes wrong:** In dev, React strict mode mounts → unmounts → remounts every component. If a page uses `useEffect(() => registerToolCallbacks({...}), [])`, the sequence is: register → deregister → register again. Without the captured-keys pattern, the second register's spread overwrites in place but the FIRST deregister (which fires AFTER the second register) deletes keys the second register just added.
**Why it happens:** Standard strict-mode mount cycle. The deregister fn returned by the first call closes over the first call's keys array (correct), but if we accidentally captured `toolCallbacksRef.current` snapshot or used the global keys, we'd delete live entries.
**How to avoid:** The locked decision (`Object.keys(callbacks)` captured at registration time) is exactly the right defense. Each register call's deregister closure references its own private `ownedKeys` array. Strict-mode double-mount becomes: register-A → register-B (now both A and B keys present) → deregister-A (removes A keys; B keys survive) → effect runs again → register-A2. Net effect: live keys are correct.
**Warning signs:** Tool calls work in production but no-op in dev → strict-mode dropping the only registered handler. Today this can't happen because there are no consumers; will become testable once Phase 27/28 wire pages.

### Pitfall 5: `runTool` async return value handling — caller's `.ok` inspection
**What goes wrong:** Some callbacks return `ControlResult` (`{ ok: boolean, ... }`), some return `void` (toggleTheme, openLink). `runTool` must inspect `.ok` only when present, treat absent as success.
**Why it happens:** TypeScript narrowing on `unknown` return — easy to write `result.ok === false` and have `result.ok` be `undefined`, which is `false`-y but not `=== false`.
**How to avoid:** Use the existing pattern from `dispatchToolCall` line 132: `result?.ok === false ? 'tool-error' : 'tool-success'`. The `=== false` check is intentional — `undefined` (no ok field) treats as success.
**Warning signs:** `toggleTheme` voice call emits `tool-error` instead of `tool-success` after the refactor → check the strict equality.

### Pitfall 6: Removing `cancelAllAudio()` from inside the synth fallback's onend
**What goes wrong:** Tempting to call `cancelAllAudio()` inside `u.onend` to also clear the synth guard, but `cancelAllAudio` ALSO unblocks `speakResolverRef` and abort the in-flight TTS — which is the wrong scope for an `onend` callback.
**Why it happens:** The synth guard SHOULD be cleared in `onend`, but `cancelAllAudio` is a sledgehammer.
**How to avoid:** Clear the specific timer ref directly in `onend`/`onerror` (and in the guard's own fire path). `cancelAllAudio` only fires from external cancel paths (stopAll, bargeIn, new turn).

## Code Examples

### Centralized `page-ready` emission in transition-provider

```typescript
// transition-provider.tsx — inside navigateWithReveal, after transition.finished
transition.finished.then(() => {
  clearTimeout(safetyTimer);
  isTransitioningRef.current = false;
  setIsTransitioningState(false);
  // VOICE-05: emit page-ready so listeners (e.g., openTextChat) can coordinate
  // without a hardcoded setTimeout. The page slug is derived from the path.
  if (typeof window !== 'undefined' && window.VoiceBus) {
    const slug = path === '/' ? 'home' : path.replace(/^\//, '');
    window.VoiceBus.emit('page-ready', slug);
  }
}).catch(() => { /* already handled */ });

// Also emit in the GSAP fallback's onComplete and the "no startViewTransition" path,
// so all three transition modes feed the same event.
```

**Note on placement:** The Claude's-discretion choice is "post-callback hook vs `useEffect` keyed on pathname." Recommendation: emit inside `transition.finished.then` (and the GSAP fallback's onComplete, and the no-startViewTransition direct-push branch). This mirrors existing transition-completion semantics — `isTransitioningRef.current = false` happens at the same point — and avoids double-emission on every pathname change unrelated to a `navigateWithReveal` call (e.g., browser back without popstate handler, programmatic `router.push` from non-voice code).

### Scribe guard with all clear paths

```typescript
const sessionGuardRef = useRef<ReturnType<typeof setTimeout> | null>(null);

const clearSessionGuard = () => {
  if (sessionGuardRef.current !== null) {
    clearTimeout(sessionGuardRef.current);
    sessionGuardRef.current = null;
  }
};

// Inside startListening, after Scribe.connect(...):
sessionGuardRef.current = setTimeout(() => {
  // Guard fires — set ref to null BEFORE close() to break re-entrancy with CLOSE handler
  sessionGuardRef.current = null;
  try { connection.close(); } catch {}
  setCaption('Speech service slow — switching to fallback');
  startListeningFallback();
}, 5000);

connection.on(RealtimeEvents.SESSION_STARTED, () => {
  clearSessionGuard();
  // ... existing attachMic logic ...
});

connection.on(RealtimeEvents.AUTH_ERROR, () => {
  clearSessionGuard();
  // ... existing logic ...
});

connection.on(RealtimeEvents.ERROR, () => {
  clearSessionGuard();
  // ... existing logic ...
});

// Outer catch (token fetch fail):
catch {
  clearSessionGuard();
  sttCtx.close().catch(() => {});
  startListeningFallback();
}

// And in cancelAllAudio:
clearSessionGuard();
```

### Synth guard inline with existing finishSynth

```typescript
// Inside the .catch fallback of streamTTS, after speechUtteranceRef.current = u;
const synthGuardRef = useRef<ReturnType<typeof setTimeout> | null>(null); // declare at hook scope
const guardMs = Math.min(30000, Math.max(1000, text.length * 50));

synthGuardRef.current = setTimeout(() => {
  synthGuardRef.current = null;
  try { synth.cancel(); } catch {}
  finishSynth(); // existing identity-checked finalizer
}, guardMs);

const clearSynthGuard = () => {
  if (synthGuardRef.current !== null) {
    clearTimeout(synthGuardRef.current);
    synthGuardRef.current = null;
  }
};

const originalFinishSynth = finishSynth;
const wrappedFinishSynth = () => { clearSynthGuard(); originalFinishSynth(); };
u.onend = wrappedFinishSynth;
u.onerror = wrappedFinishSynth;
```

## Runtime State Inventory

This is a code-only edit phase (no migrations, no rebrands). Inventory included for completeness.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — voice history in `localStorage['pf-voice-history']` is unaffected; no schema change. | None |
| Live service config | None — Scribe SDK config is in-code (`Scribe.connect({...})`); no external dashboard. | None |
| OS-registered state | None | None |
| Secrets/env vars | None — `/api/stt-token` and `/api/tts` route names unchanged; ElevenLabs API keys server-side, not touched. | None |
| Build artifacts | None — no package version bumps, no schema migrations. | None |

**Verified:** All changes are surgical edits to TypeScript source. No runtime state to migrate.

## Environment Availability

Skipped — phase has no external dependency adds. All edits use already-installed packages (`react`, `next`, `@elevenlabs/client`).

## Common Pitfalls — Quick Reference Card

| # | Pitfall | One-line guard |
|---|---------|---------------|
| 1 | View Transitions emit ordering | Emit on `transition.finished`, keep per-page emits as fallback, gate listener with `fired` flag |
| 2 | Scribe guard outliving close | Add to `cancelAllAudio` cleanup AND clear in all 4 connection events (SESSION_STARTED, AUTH_ERROR, ERROR, plus catch) |
| 3 | Synth onend race with guard | Wrap `finishSynth` to clearTimeout first; identity check in `finishSynth` is final safety net |
| 4 | Strict-mode register/deregister | Capture `Object.keys(callbacks)` per registration call into `const ownedKeys` |
| 5 | `result.ok` undefined vs false | Use `result?.ok === false` (strict equality) — undefined treats as success |
| 6 | Sledgehammer cancelAllAudio in onend | Clear specific timer ref only; `cancelAllAudio` is for external cancel only |

## State of the Art

| Old Approach | Current Approach | Why Changed |
|--------------|------------------|-------------|
| Fixed `setTimeout(..., 400)` waiting for next page mount | One-shot VoiceBus event listener with safety timeout | View Transitions API mount timing varies; event-driven coordination is correct primitive |
| Bare callback invocation in switch case | `runTool(name, fn)` wrapper with try/catch | Single throw site shouldn't abort the whole voice turn; consumers (FSB-04) need reliable `tool-executing/success/error` events |
| Fire-and-forget `Scribe.connect()` | Connect + 5 s guard timer + fallback to Web Speech | Audit found silent stall mode where Scribe accepts connection but emits no events |
| `synth.speak(u)` with only `onend`/`onerror` | Same + worst-case timeout proportional to text length | Safari (and any browser with disabled synth engine) silently no-ops `synth.speak` |
| `registerToolCallbacks` with no deregister | Returns `() => void` deregister fn | Pages now navigating between routes accumulate stale handlers; useEffect cleanup contract |

**Deprecated/outdated:** The 400 ms `setTimeout` in `voice-session-provider.tsx:82` is being replaced — but the comment "If timing is still off, increase to 500ms" stays as a note that the safety-timeout fallback IS the increased-delay path, just adaptive.

## Project Constraints (from CLAUDE.md)

| Directive | Source | Compliance plan |
|-----------|--------|----------------|
| Tech stack: Next.js (App Router), React, TypeScript, Tailwind | project CLAUDE.md | All edits stay in `.tsx` / `.ts` files; no Tailwind changes |
| API security: API keys server-side only | project CLAUDE.md | Untouched — no API route changes; Scribe token still issued by `/api/stt-token` |
| GSD Workflow Enforcement: only edit through GSD commands | project CLAUDE.md | Phase 25 is a GSD-tracked phase |
| Never use emojis in code/markdown unless explicitly asked | global CLAUDE.md | Caption strings use plain text + em-dash; no emoji in any new code or this RESEARCH.md |
| Never run applications automatically | global CLAUDE.md | Research phase: read-only investigation; no `npm run dev` triggered |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `transition.finished` resolves AFTER the destination page's `useEffect` mounts (so per-page `page-ready` emit always wins the race against transition-provider's emit) | Pitfall 1 | If wrong, transition-provider's emit could arrive FIRST, but the listener's `fired` gate makes second-arrival a no-op — net effect: still correct, just different winner. Low risk. [ASSUMED based on View Transitions API semantics] |
| A2 | React 19 + Next.js 15 strict-mode behavior matches React 18 (mount → cleanup → mount) | Pitfall 4 | If React 19 changes strict-mode (e.g., parallel mounts), the captured-keys pattern still works because each register call has its own private closure. Low risk. [ASSUMED — would need React 19 release notes verification] |
| A3 | `synth.cancel()` is idempotent across browsers (calling twice doesn't throw) | Pitfall 3 | If a browser throws on second cancel, current code at line 228 (in `cancelAllAudio`) would already throw — but it's wrapped in try/catch. Same try/catch wrap on the guard's `synth.cancel()` call neutralizes risk. Low risk. [ASSUMED based on Web Speech API spec — already used safely elsewhere in file] |
| A4 | `connection.close()` from inside the guard timer doesn't trigger the CLOSE handler synchronously while guard is firing | Pitfall 2 / Code Examples | If it does, setting `sessionGuardRef.current = null` BEFORE calling `close()` already breaks the loop. Low risk. [ASSUMED based on standard EventEmitter semantics in `@elevenlabs/client`] |
| A5 | `Math.max(1000, text.length * 50)` is a reasonable upper bound for SpeechSynthesis utterance duration | VOICE-07 lock | The 30000 ms cap (= 600 chars at 50 ms/char) covers the longest plausible Parz utterance; longer text would use a TTS-API path anyway. Low risk; cap can be tuned. [ASSUMED based on audit fix sketch — locked by user decision] |

**For the planner:** A1-A4 are low-impact assumptions with built-in safety nets (existing try/catch, listener `fired` gate, identity checks). A5 is locked by the user. None require user re-confirmation before planning.

## Open Questions (RESOLVED)

1. **Does `transition-provider`'s `popstate` handler need its own `page-ready` emission?**
   - What we know: line 146-153 wires `popstate` → `navigateWithReveal(prevPath, ...)`, which goes through the same `transition.finished.then` path → emit will fire.
   - What's unclear: nothing — the call chain confirms popstate already routes through the emit.
   - Recommendation: emit only in `navigateWithReveal`'s three terminal branches (View Transitions success, GSAP fallback onComplete, no-startViewTransition direct push).

2. **Should the safety timer in `openTextChat` start at the goPage call, or only after a paint frame?**
   - What we know: locked decision says 1500 ms safety timer; existing 400 ms is the floor case.
   - What's unclear: whether `goPage('home')` is synchronous enough that the listener attaches before the destination page mounts (so the `page-ready` event isn't missed).
   - Recommendation: attach the listener BEFORE calling `goPage` is unnecessary — `goPage` triggers `siteControl.navigate` or `navigateWithReveal`, both async via `router.push`. The listener attachment in the SAME synchronous block as `goPage` is fine: React schedules the navigation after current task; listener is live by the time the destination mounts. Confirmed by reading `navigateWithReveal` → `router.push(path)` is inside `transition.startViewTransition` callback (async).

## Sources

### Primary (HIGH confidence)
- `src/lib/voice-controller.ts` (lines 125, 214, 343, 693) — full read of every fix target
- `src/providers/voice-session-provider.tsx` (full file) — `registerToolCallbacks` and `openTextChat` current state
- `src/providers/transition-provider.tsx` (full file) — emission site for `page-ready`
- `src/lib/voice-bus-init.ts` (full file) — VoiceBus contract: `on`/`off`/`emit` semantics, listener Set, exception-safe emit
- `src/types/voice-bus.d.ts` — VoiceBus typings
- `src/app/page.tsx`, `src/app/portfolio/page.tsx`, `src/app/about/page.tsx` — existing `page-ready` emission audit
- `.planning/milestones/v4.1-21-AUDIT.md` (lines 153-223) — original audit findings F-05..09 with fix sketches
- `.planning/REQUIREMENTS.md` — VOICE-05..09 with file:line evidence
- `package.json` — version verification

### Secondary (MEDIUM confidence)
- React 19 strict-mode behavior — based on React 18 documented behavior; React 19 release notes not re-checked in this session
- View Transitions API timing semantics — based on MDN spec; not re-verified this session

### Tertiary (LOW confidence)
- None — all critical claims have primary source backing

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; all existing primitives verified in source
- Architecture: HIGH — all fix patterns confirmed against current code structure
- Pitfalls: HIGH — patterns derived from existing Phase 22 code (identity checks, ref tracking, AbortController) plus audit's documented gotchas
- VoiceBus event contract: HIGH — direct read of `voice-bus-init.ts`

**Research date:** 2026-04-26
**Valid until:** 2026-05-26 (30 days — code targets are stable, ElevenLabs SDK version pinned)
