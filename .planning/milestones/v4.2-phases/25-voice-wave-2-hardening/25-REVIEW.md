---
phase: 25-voice-wave-2-hardening
reviewed: 2026-04-26T00:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - src/lib/voice-controller.ts
  - src/providers/voice-session-provider.tsx
  - src/providers/transition-provider.tsx
findings:
  critical: 0
  warning: 4
  info: 6
  total: 10
status: issues_found
---

# Phase 25: Code Review Report

**Reviewed:** 2026-04-26
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Voice Wave 2 hardening (VOICE-05 through VOICE-09) is implemented soundly. The five hardening areas — runTool exception wrapping, registerToolCallbacks deregister, 5s Scribe SESSION_STARTED guard, page-ready event coordination, and SpeechSynthesis worst-case timeout — all have correct primary logic with appropriate identity checks, idempotent clearers, and safety nets.

Findings break down into:

- 4 Warnings: a deregister-overwrite hazard between `registerToolCallbacks` and the provider's static useEffect (VOICE-08); a `startListening` re-entrancy race that can leak Scribe connections; a fire-and-forget Promise in `runTool` whose async outcome is reported optimistically; and `prefersReduced` captured once at hook init, so a mid-session OS preference change won't update barge-in thresholds.
- 6 Info items: minor quality issues including unused `_initialText` parameter, redundant non-null assertions, the `open()` setTimeout not being cancelable on close, unbounded `historyRef` growth during a session, redundant `currentPage` derivation already exposed by the controller, and the 600ms safety timer in the transition provider that resets state but does not also emit `page-ready`.

No critical security issues, no exposed secrets, no injection vectors, no eval/innerHTML usage. The five Wave 2 hardening features themselves are implemented correctly and would pass acceptance.

## Warnings

### WR-01: registerToolCallbacks deregister can wipe provider-owned tool callbacks

**File:** `src/providers/voice-session-provider.tsx:46-54`
**Issue:** `registerToolCallbacks` captures `Object.keys(callbacks)` as `ownedKeys` and on deregister calls `delete toolCallbacksRef.current[k]` for each owned key. The provider's own useEffect (lines 59-75) also writes to the same ref — `toggleTheme`, `openLink`, `openProject`, `scrollTo`, `closeBrowser`, `openCurrentProjectExternal`, `unsupportedIframeControl`. If a future consumer registers any of these same keys (e.g., a page-specific override of `openProject`) and later unmounts, the deregister fn deletes the key. The provider's useEffect only re-runs when `[resolvedTheme, setTheme, siteControl]` changes, so until one of those changes the tool is permanently unwired, even though the provider conceptually still owns it. Last-write-wins on register is by design, but last-delete-wipes-everything on deregister is not.

This is currently latent because no consumer in the tree calls `registerToolCallbacks` for any of the seven keys the useEffect owns. It becomes a real bug the first time someone does.

**Fix:**
```typescript
// Snapshot prior values for owned keys at registration time, restore on deregister.
const registerToolCallbacks = useCallback((callbacks: ToolCallbacks): (() => void) => {
  const ownedKeys = Object.keys(callbacks) as (keyof ToolCallbacks)[];
  const prior: Partial<ToolCallbacks> = {};
  for (const k of ownedKeys) {
    if (k in toolCallbacksRef.current) {
      // Cast: we are mirroring whatever the ref currently holds.
      (prior as Record<string, unknown>)[k] = toolCallbacksRef.current[k];
    }
  }
  toolCallbacksRef.current = { ...toolCallbacksRef.current, ...callbacks };
  return () => {
    for (const k of ownedKeys) {
      if (k in prior) {
        (toolCallbacksRef.current as Record<string, unknown>)[k] = (prior as Record<string, unknown>)[k];
      } else {
        delete toolCallbacksRef.current[k];
      }
    }
  };
}, []);
```

### WR-02: startListening is async — concurrent invocations can leak a Scribe connection

**File:** `src/lib/voice-controller.ts:737-828`
**Issue:** `startListening` is `async`. Between line 744 (creating `sttCtx`) and line 818 (`connectionRef.current = connection`), there are several `await` points (token fetch, JSON parse). If the user clicks the mic twice quickly, or the keyboard `Space` shortcut fires twice during that window (line 924, `void startListening()`), two parallel `Scribe.connect(...)` calls are issued. The second one overwrites `connectionRef.current` while the first is still alive — its event listeners remain registered, the SDK's internal `getUserMedia` stream is still open, and there is no `connection.close()` for the abandoned first session. This burns a single-use STT token and leaks a media stream until the underlying SDK garbage-collects it.

The `Space` keydown guard at line 922 (`window.VoiceBus.state !== 'listening'`) helps but is not airtight: state is only set to `'listening'` once, before the first `await`, so a second keydown that arrives before that scheduling is unlikely. More importantly, the mic button (`onMic` in `voiceProps`) routes through `startListening` directly with no in-flight guard.

**Fix:**
```typescript
// Add a ref-based "in flight" guard at the top of startListening.
const startingRef = useRef(false);
// ...
const startListening = useCallback(async () => {
  if (startingRef.current) return;
  startingRef.current = true;
  try {
    window.VoiceBus.setState('listening');
    setCaption('Listening\u2026');
    const sttCtx = new AudioContext({ sampleRate: 16000 });
    // ...rest of existing body...
  } finally {
    startingRef.current = false;
  }
}, [handleUserTurn, startListeningFallback]);
```

### WR-03: runTool reports async outcomes optimistically; thrown rejections are not surfaced to the caller

**File:** `src/lib/voice-controller.ts:135-161`
**Issue:** When the wrapped fn returns a Promise, `runTool` returns `{ ok: true }` synchronously (line 151) and emits `tool-success`/`tool-error` later via the `.then(...)` chain. The comment on line 134 acknowledges this. There are two real consequences:

1. The synchronous return value `{ ok: true }` is a lie for any tool whose Promise rejects or resolves to `{ ok: false }`. Today no caller of `runTool` consumes its return value (each `dispatchToolCall` case throws away the result), so this is latent. If a future caller decides to gate behaviour on `runTool(...).ok`, they will silently get the wrong answer for async tools.
2. None of the registered tool callbacks in `voice-session-provider.tsx` actually return Promises today — `siteControl.*` returns `ControlResult` synchronously, `setTheme`/`window.open` are sync. So this branch of `runTool` is currently dead. That is fine, but the comment should match reality, or the path should be removed until needed.

**Fix:** Either drop the unused async branch (preferred — simpler code), or change the contract so `runTool` always returns a Promise:
```typescript
const runTool = async (name: string, fn: () => unknown): Promise<{ ok: boolean }> => {
  const hasBus = typeof window !== 'undefined' && !!window.VoiceBus;
  if (hasBus) window.VoiceBus.emit('tool-executing');
  try {
    const result = await fn();
    const ok = !(result && typeof result === 'object' && 'ok' in (result as object) && (result as { ok: boolean }).ok === false);
    if (hasBus) window.VoiceBus.emit(ok ? 'tool-success' : 'tool-error');
    return { ok };
  } catch (err) {
    console.error(`[VoiceController] ${name} threw/rejected:`, err);
    if (hasBus) window.VoiceBus.emit('tool-error');
    return { ok: false };
  }
};
```
Callers in `dispatchToolCall` would then `void runTool(...)` to keep them fire-and-forget, which they already are.

### WR-04: prefersReduced is captured once at hook init and never updates

**File:** `src/lib/voice-controller.ts:73-76`
**Issue:** `prefersReduced` is computed by reading `window.matchMedia(...).matches` once during the function body. There is no `addEventListener('change', ...)` on the media query, so if the user toggles their OS-level reduced-motion preference mid-session (or DevTools emulates it), the barge-in `useEffect` (lines 848-865) will keep using the stale value for both `effectiveLevel` cap and `threshold`. The exported `prefersReduced` returned to consumers is also stale, so any caller that gates GSAP morph on it (D-24) keeps the old behaviour for the rest of the session.

This won't crash anything, but it diverges from the documented promise that the controller respects reduced-motion preferences.

**Fix:**
```typescript
const [prefersReduced, setPrefersReduced] = useState(() =>
  typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false
);

useEffect(() => {
  if (typeof window === 'undefined') return;
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const onChange = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}, []);
```

## Info

### IN-01: openTextChat _initialText parameter is accepted but never used

**File:** `src/providers/voice-session-provider.tsx:94-115`
**Issue:** The signature is `(_initialText?: string) => { ... }`. The leading underscore signals intent to the linter, but the parameter is never threaded into the dispatched `parz:open-text-chat` event. Either pass it through (so a tool-driven "switch to text and seed with X" flow works) or drop the parameter from the type so `ToolCallbacks` consumers don't believe it does something.

**Fix:** If you want it to work, include it in the event detail:
```typescript
window.dispatchEvent(new CustomEvent('parz:open-text-chat', { detail: { initialText: _initialText } }));
```
Or remove the parameter from the type and the callback signature.

### IN-02: dispatchToolCall uses redundant non-null assertions after presence checks

**File:** `src/lib/voice-controller.ts:172-225`
**Issue:** Each switch arm reads `if (toolCallbacks?.openProject) { runTool('openProject', () => toolCallbacks.openProject!(...)); }`. The `!` is unreachable-by-type once the `if` has narrowed. TypeScript's narrowing inside the arrow doesn't always carry through (it depends on `strict` and on whether the closure boundary disturbs narrowing), which is presumably why `!` was added. Cleaner: capture the local.

**Fix:**
```typescript
case 'openProject': {
  const fn = toolCallbacks?.openProject;
  if (fn) runTool('openProject', () => fn(args as { slug: string }));
  else { console.warn(...); window.VoiceBus?.emit('tool-error'); }
  break;
}
```
Apply consistently across all seven arms; removes seven `!` assertions.

### IN-03: open() setTimeout has no cancellation handle

**File:** `src/lib/voice-controller.ts:885-892`
**Issue:** The 480ms greet timer is fired via bare `setTimeout` with no stored ID. If `close()` is called before 480ms elapses, the timer still fires; the inner guards (`activeRef.current`, `speakingRef.current`, `VoiceBus.state !== 'idle'`) prevent the greet from running, so the bug is currently masked. A storable ID would make the intent explicit and the test surface narrower.

**Fix:**
```typescript
const greetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
// in open():
greetTimerRef.current = setTimeout(() => { greetTimerRef.current = null; /* ... */ }, 480);
// in close():
if (greetTimerRef.current) { clearTimeout(greetTimerRef.current); greetTimerRef.current = null; }
```

### IN-04: historyRef grows unbounded during a session before localStorage persistence trims to 20

**File:** `src/lib/voice-controller.ts:499-503, 595-598, 900`
**Issue:** Each turn does `historyRef.current = [...historyRef.current, { role, content }]`. The slice-to-20 only happens at `close()` when persisting. For a long voice session, the in-memory array grows without bound, and the `slice(-20)` on line 508 covers the LLM call but not the persisted truncation. Memory cost is small (text only), but it's a tidy quality issue.

**Fix:** Cap on append, not just on persist:
```typescript
historyRef.current = [...historyRef.current.slice(-19), { role: 'user', content: utterance }];
```

### IN-05: currentPage is derived in voice-session-provider but the controller already accepts pathname-derived input

**File:** `src/providers/voice-session-provider.tsx:118`
**Issue:** `const currentPage = pathname === '/' ? 'home' : pathname.slice(1);` is fine, but `pathname.slice(1)` for a path like `/portfolio/foo` yields `portfolio/foo`, which the LLM greeting (`voice-controller.ts:890`) interpolates verbatim into the kickoff trigger. There are no nested routes today; if you add any (e.g., a project detail route), the greeting will say "Voice mode just opened on the portfolio/foo page." Worth normalising now.

**Fix:**
```typescript
const currentPage = pathname === '/' ? 'home' : pathname.split('/').filter(Boolean)[0] ?? 'home';
```

### IN-06: transition-provider 600ms safety timer resets isTransitioning but does not emit page-ready

**File:** `src/providers/transition-provider.tsx:88-115`
**Issue:** Inside `transition.ready.then(...)`, a 600ms safety timer resets `isTransitioningRef.current` and the state flag. `emitPageReady()` is only called from the `transition.finished.then(...)` arm. If `transition.finished` never resolves (truly stuck transition), the safety timer unlocks navigation but no `page-ready` ever fires for that nav. The voice-session-provider's own 1500ms safety in `openTextChat` covers the immediate consumer, but any future listener that does not include its own safety timer will be silently starved.

This is a coordination-design concern, not a bug per se — the contract today is "page-ready is best-effort, listeners must have their own timeout." Worth either making that explicit in a comment, or emitting from the safety timer too:

**Fix:**
```typescript
const safetyTimer = setTimeout(() => {
  isTransitioningRef.current = false;
  setIsTransitioningState(false);
  emitPageReady();          // ensure listeners aren't starved on stuck transitions
}, 600);
// And gate the finished-handler's emit so it doesn't double-fire:
let emitted = false;
const safeEmit = () => { if (!emitted) { emitted = true; emitPageReady(); } };
// ...replace both call sites with safeEmit().
```

---

_Reviewed: 2026-04-26_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
