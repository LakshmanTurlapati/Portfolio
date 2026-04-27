---
phase: 25-voice-wave-2-hardening
plan: 01
subsystem: voice-controller
tags: [voice, refactor, error-handling]
requires: []
provides:
  - "runTool helper inside useVoiceController that wraps every tool callback"
  - "Defensive boundary so a throwing tool callback no longer aborts a voice turn"
affects:
  - "src/lib/voice-controller.ts (dispatchToolCall: 7 cases consolidated through runTool)"
tech-stack:
  added: []
  patterns:
    - "runTool factory inside hook closure (sync + thenable handling, console.error on failure, single-emit-per-callback)"
    - "Strict-equality narrowing on `result.ok === false` so undefined results stay 'ok' (Pitfall 5)"
key-files:
  created: []
  modified:
    - "src/lib/voice-controller.ts: added runTool at line 126; refactored dispatchToolCall cases at lines 162-216"
decisions:
  - "Synchronous return shape: runTool returns { ok } so callers (currently none externally) can read outcome; async paths return { ok: true } optimistically and emit final tool-success/error from the .then callback"
  - "Missing-handler branch deliberately preserved (console.warn + raw window.VoiceBus.emit('tool-error')) -- skips tool-executing because no work was attempted, matching the existing semantics that Phase 27 FSB-04 will subscribe to"
  - "navigate and endCall stay bare per RESEARCH.md anti-pattern: they are internal control-flow, not user-defined callbacks, so wrapping them is wrong"
metrics:
  duration: "~3 minutes wall clock"
  completed: "2026-04-26T20:05:36Z"
  tasks: 2
  files_modified: 1
---

# Phase 25 Plan 01: Tool Callback Exception Wrapping (VOICE-09) Summary

One-liner: runTool() helper inside useVoiceController isolates throwing tool callbacks so a single bad callback no longer aborts the entire voice turn.

## What Was Implemented

VOICE-09 from `21-AUDIT.md` is closed. Today, if `toolCallbacks.openProject` (or any of the seven tool callbacks) throws synchronously, the throw escapes `dispatchToolCall`, propagates up through `handleUserTurn`'s for-loop, and aborts the rest of the turn — including speaking the assistant's response. After this plan, every callback invocation is wrapped in a single `runTool(name, fn)` helper that:

1. Emits `tool-executing` on entry (when VoiceBus is available).
2. Invokes the callback inside try/catch.
3. Detects thenable results and attaches `.then` / catch handlers, emitting `tool-success` / `tool-error` on settle.
4. For synchronous returns, applies a strict-equality `result.ok === false` narrowing pattern so an undefined-or-void return is treated as success (matching today's semantics for `openLink` and `toggleTheme`, which return void).
5. Catches and logs throws via `console.error('[VoiceController] {name} threw:', err)` and emits `tool-error` instead of re-throwing.
6. Returns `{ ok }` so future callers can inspect outcome without subscribing to VoiceBus.

The seven tool cases inside `dispatchToolCall` were rewritten to delegate to `runTool` while keeping their missing-handler `else` branches byte-identical (console.warn + raw `window.VoiceBus.emit('tool-error')` with no `tool-executing`). `navigate`, `endCall`, and `default` stay bare per the research anti-pattern: they are internal control-flow, not user callbacks.

## Files

- **`src/lib/voice-controller.ts`** -- runTool helper at line 126; dispatchToolCall consolidated at lines 159-225 (7 wrapped cases at 162-216, navigate at 218, endCall at 221, default at 224)

## Tasks

| # | Name | Commit | Notes |
|---|------|--------|-------|
| 1 | Add runTool helper inside useVoiceController | `8c6921f` | Helper placed immediately above dispatchToolCall; not exported |
| 2 | Refactor dispatchToolCall to use runTool for all 7 callback cases | `8b0a413` | navigate / endCall / default unchanged; missing-handler branches unchanged |

## Decisions Made

- **Sync return shape `{ ok: boolean }`** -- preserves return-value semantics for any future callers that want to chain on the outcome; async paths optimistically return `{ ok: true }` and emit the real outcome via the `.then` callback later (today's call sites do not read the return value).
- **Missing-handler emit shape preserved** -- console.warn with the same `[VoiceController] X tool called but no toolCallbacks.X provided` prefix and a raw `tool-error` emit (no `tool-executing`). This matches the documented Phase 25 / VOICE-09 missing-handler decision in `25-CONTEXT.md`: skip `tool-executing` because nothing actually executed.
- **navigate / endCall stay bare** -- per RESEARCH.md anti-pattern. These are not external callbacks but internal control-flow; wrapping them would change semantics (e.g., emitting tool-success for navigate would conflate route changes with tool execution).
- **Strict-equality narrowing** -- `'ok' in (r as object) && (r as { ok: boolean }).ok === false`. This handles the void-returning callbacks (`openLink`, `toggleTheme`) which produce `undefined`; their `result?.ok === false` check today already treats undefined as success, and the runTool implementation matches that exactly to avoid a behavior change.

## Verification

- **Lint:** `npm run lint -- src/lib/voice-controller.ts` -> 0 errors, 0 warnings.
- **Build:** `npm run build` -> all routes compile, no TypeScript errors. (Note: `npm install --legacy-peer-deps` was run in the worktree to populate `node_modules`; the peer-dep mismatch between `@ai-sdk/react@3.0.147` and `react@19.1.0` is pre-existing and unrelated to this plan.)
- **Acceptance criteria:**
  - `grep -c "runTool('"` -> 7 (one per wrapped tool case).
  - All 7 expected tool names found via `grep -E "runTool\('(openProject|scrollTo|openLink|closeBrowser|openCurrentProjectExternal|unsupportedIframeControl|toggleTheme)'"`.
  - `grep -c "tool called but no toolCallbacks\."` -> 7 (missing-handler warns preserved).
  - `grep -c "const result = toolCallbacks\."` -> 0 (old inline pattern fully removed).
  - `case 'navigate':` and `case 'endCall':` remain bare with their original bodies.
  - Event names unchanged: only `tool-executing`, `tool-success`, `tool-error` appear.

## Deviations from Plan

None -- plan executed exactly as written.

The plan called for `npm run lint` and `npm run build` as automated verification. Build initially failed because `node_modules` was not present in the freshly-checked-out worktree; running `npm install --legacy-peer-deps` resolved it. This is a worktree environment quirk (pre-existing peer-dep conflict between `@ai-sdk/react@3.0.147` and `react@19.1.0`), not an issue introduced by this plan; the build at base commit 9823a7b reproduces the same pre-install missing-module errors. Documenting here for transparency, not as a deviation from the implementation plan.

## Authentication Gates

None -- this plan is purely an internal refactor of voice-controller.ts.

## Known Stubs

None.

## Threat Flags

None -- the threat_model section explicitly stated this plan introduces no new external surface. The runTool helper is a defensive boundary that *reduces* the blast radius of a misbehaving tool callback; it does not open a new attack surface.

## Phase 27 FSB-04 Compatibility

Phase 27 FSB-04 will subscribe to `tool-executing` for caption tracking. This plan preserves the exact event emission contract:

- Wired callbacks: `tool-executing` -> (callback runs) -> `tool-success` or `tool-error` (one of the two, exactly once per invocation).
- Missing handlers: bare `tool-error` only, no `tool-executing` (consistent with "nothing executed").
- Internal control flow (navigate / endCall): no events.

Phase 27 will see identical event semantics; the only difference is that throwing callbacks now reliably emit `tool-error` instead of crashing the turn before any post-callback emit fires.

## Self-Check: PASSED

Verified before writing this summary:

```
[ FOUND ] src/lib/voice-controller.ts:126 const runTool = (name: string, fn: () => unknown): { ok: boolean } => {
[ FOUND ] commit 8c6921f -- feat(25-01): add runTool helper in useVoiceController
[ FOUND ] commit 8b0a413 -- refactor(25-01): route 7 dispatchToolCall cases through runTool
[ FOUND ] All 7 runTool('...') invocations at lines 164, 172, 180, 188, 196, 204, 212
[ FOUND ] navigate stays bare at line 218; endCall stays bare at line 221
[ FOUND ] 0 occurrences of the removed pattern "const result = toolCallbacks."
[ PASS ] npm run lint clean
[ PASS ] npm run build succeeded
```
