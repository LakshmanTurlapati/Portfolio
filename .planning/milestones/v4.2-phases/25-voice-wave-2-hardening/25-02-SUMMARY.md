---
phase: 25-voice-wave-2-hardening
plan: 02
subsystem: voice
tags:
  - voice
  - lifecycle
  - react
requirements:
  - VOICE-08
dependency_graph:
  requires:
    - 25-01 (VOICE-09 runTool wrapping; sibling plan in same phase)
  provides:
    - registerToolCallbacks deregister contract for future consumers (Phase 27 FSB-04, Phase 28 chat redesign)
  affects:
    - src/providers/voice-session-provider.tsx (registerToolCallbacks signature + impl)
tech_stack:
  added: []
  patterns:
    - capture-at-registration (Object.keys snapshot at call site)
    - deregister-fn return shape (() => void)
key_files:
  created: []
  modified:
    - src/providers/voice-session-provider.tsx
decisions:
  - VOICE-08 deregister captures ownedKeys at registration time (not at deregister call) -- defends against caller mutating its callbacks object after registration
  - Provider-owned defaults (toggleTheme, openLink, openProject, scrollTo, closeBrowser, openCurrentProjectExternal, unsupportedIframeControl) are NOT touched by deregister because they were never in any consumer's ownedKeys
metrics:
  duration: ~3 minutes
  completed: 2026-04-26T20:11:20Z
  tasks: 1
  files_changed: 1
---

# Phase 25 Plan 02: registerToolCallbacks Deregister Fn (VOICE-08) Summary

One-liner: `registerToolCallbacks` now returns a `() => void` deregister fn that removes exactly the keys it registered (captured via `Object.keys` at registration time), enabling the standard React `useEffect(() => register({...}), [])` cleanup pattern without ever touching provider-owned defaults.

## What Was Built

Audit finding F-08 (`21-AUDIT.md` Wave 2) flagged that `src/providers/voice-session-provider.tsx`'s `registerToolCallbacks` had no deregister contract -- pages navigating between routes would accumulate stale tool handlers. Plan 25-02 closes that by:

1. Updating the `VoiceSessionContextType.registerToolCallbacks` interface return type from `void` to `() => void`.
2. Rewriting the `useCallback` body to:
   - capture `Object.keys(callbacks)` at registration time into `ownedKeys`,
   - merge the callbacks into the shared `toolCallbacksRef`, and
   - return a closure that deletes EXACTLY `ownedKeys` from the ref on call.
3. Adding `VOICE-08` traceability comments referencing RESEARCH.md Pitfall 4 (React 19 strict-mode double-mount safety).

The captured-keys defense ensures:
- A consumer mutating its callbacks object after registration cannot retroactively change which keys its deregister fn deletes.
- Provider-owned defaults (`toggleTheme`, `openLink`, `openProject`, `scrollTo`, `closeBrowser`, `openCurrentProjectExternal`, `unsupportedIframeControl`) installed by the `useEffect` at lines 59-75 are never in any consumer's `ownedKeys`, so they survive any consumer's deregister.
- React 19 strict-mode double-mount cycles (register A -> register B -> deregister A) leave B's keys live.

Per RESEARCH.md, there are zero current consumers of `registerToolCallbacks`, so this is a purely additive contract change. Future Phase 27 (FSB-04) and Phase 28 (chat redesign) consumers can adopt the standard `useEffect` cleanup pattern.

## Files Modified

| File | Lines Touched | Purpose |
|------|--------------|---------|
| `src/providers/voice-session-provider.tsx` | 21 (interface), 41-54 (impl + comments) | Update interface + impl to return deregister fn |

### Specific Locations

- **Interface change:** `src/providers/voice-session-provider.tsx:21`
  - Before: `registerToolCallbacks: (callbacks: ToolCallbacks) => void;`
  - After: `registerToolCallbacks: (callbacks: ToolCallbacks) => () => void;  // VOICE-08: returns deregister fn`

- **Implementation change:** `src/providers/voice-session-provider.tsx:46-54`
  - New body captures `ownedKeys`, merges into ref, returns deregister closure.
  - `delete toolCallbacksRef.current[k]` on `voice-session-provider.tsx:51` is the key removal site.

## Verification Run

Automated:
- `npm run lint -- src/providers/voice-session-provider.tsx`: 0 errors, 1 pre-existing warning (`_initialText` unused -- out-of-scope, owned by Plan 03 which modifies `openTextChat`).
- `npm run build`: succeeded (12 pages built, all routes intact).

Acceptance criteria from PLAN (all PASS):
- [x] AC1: Interface signature updated (1 grep match)
- [x] AC2: Impl `useCallback` signature updated (1 grep match)
- [x] AC3: `ownedKeys = Object.keys(callbacks)` capture present (1 grep match)
- [x] AC4: `delete toolCallbacksRef.current[k]` present (1 grep match)
- [x] AC5: `VOICE-08` traceability comments (2 matches >= 1 required)
- [x] AC6: Provider-owned defaults `useEffect` intact (1 grep match for `toggleTheme = ()`)
- [x] AC7: Statement order check (`ownedKeys` < merge < `return () =>`) PASS

## Deviations from Plan

None -- plan executed exactly as written. The exact body specified in the plan's `<action>` block was applied verbatim, with no shape changes to neighboring code.

### Pre-existing environment note (out of scope)

The worktree did not have `node_modules` installed when execution began, causing the initial `npm run build` to fail with `Module not found: Can't resolve '@elevenlabs/elevenlabs-js'`. Resolved by running `npm install --legacy-peer-deps` (the project requires legacy peer deps because `@ai-sdk/react@3.0.147` lists React 19.1.2 as a peer but the project pins React 19.1.0). This is purely worktree environment setup; no source-tree change. The `--legacy-peer-deps` install state is local to the worktree and does not affect the commit.

## Decisions Made

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Capture `ownedKeys` via `Object.keys(callbacks)` at registration time | Prevents caller mutation of its callbacks object from changing what the deregister fn deletes; survives React 19 strict-mode double-mount | Implemented |
| Type cast `Object.keys(callbacks) as (keyof ToolCallbacks)[]` | `Object.keys` returns `string[]` by default; the cast narrows to the discriminated union of `ToolCallbacks` keys for typesafe `delete toolCallbacksRef.current[k]` | Implemented |
| Leave `openTextChat` (lines 91-99) untouched | Plan 03 owns the `openTextChat` race fix (VOICE-05); this plan is strictly the deregister contract | Implemented |
| Leave provider-owned defaults `useEffect` (lines 59-75) untouched | Defaults must persist across consumer deregisters; consumer `ownedKeys` will never include them at registration time | Implemented |

## Self-Check: PASSED

- [x] FOUND: src/providers/voice-session-provider.tsx (modified)
- [x] FOUND: ba7a1f8 (commit "feat(25-02): registerToolCallbacks returns deregister fn (VOICE-08)")
- [x] FOUND: .planning/phases/25-voice-wave-2-hardening/25-02-SUMMARY.md (this file)

## Commits

| Task | Hash | Message |
|------|------|---------|
| 1 | ba7a1f8 | feat(25-02): registerToolCallbacks returns deregister fn (VOICE-08) |
