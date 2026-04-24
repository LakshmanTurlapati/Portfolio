---
phase: 13-tool-callbacks-and-visual-feedback
plan: "01"
subsystem: voice
tags: [voice, tool-callbacks, voicebus, race-condition, typescript]
dependency_graph:
  requires: []
  provides:
    - registerToolCallbacks API in VoiceSessionContext
    - VoiceBus tool-executing/tool-success/tool-error signals
    - waitForPage helper with page-ready event wait
  affects:
    - src/providers/voice-session-provider.tsx
    - src/lib/voice-controller.ts
tech_stack:
  added: []
  patterns:
    - useRef-based callback registry (stable reference, avoids stale closures)
    - VoiceBus event signaling around tool dispatch
    - Promise.race for event-based wait with timeout fallback
key_files:
  created: []
  modified:
    - src/providers/voice-session-provider.tsx
    - src/lib/voice-controller.ts
decisions:
  - toolCallbacksRef uses useRef not useState — prevents stale closure in dispatchToolCall memoization; ref object reference is stable so VoiceController always reads fresh callbacks
  - toggleTheme and openLink wired once in VoiceSessionProvider useEffect — no per-page registration needed since they have no page-specific state
  - waitForPage uses Promise.race with 1500ms timeout — handles both cases where page emits page-ready quickly and where it is already mounted (no event fires)
  - navigate and endCall cases intentionally excluded from tool-executing/tool-success signals — they are internal routing, not user-facing tool calls
metrics:
  duration: 97s
  completed: "2026-04-24"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 2
---

# Phase 13 Plan 01: Tool Callback Registry and VoiceBus Signals Summary

**One-liner:** Callback registration API via useRef registry in VoiceSessionProvider plus VoiceBus tool-executing/tool-success/tool-error signals wrapping every dispatchToolCall branch and page-ready event wait replacing hardcoded 500ms in startTour.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Extend VoiceSessionProvider with registerToolCallbacks, toolCallbacksRef, wired toggleTheme/openLink | 8d0f434 | src/providers/voice-session-provider.tsx |
| 2 | Update dispatchToolCall VoiceBus signals and fix startTour race condition | eb2fe56 | src/lib/voice-controller.ts |

## What Was Built

### Task 1 — VoiceSessionProvider extension

`src/providers/voice-session-provider.tsx` received five changes:

1. Added `useRef`, `useEffect` to React imports; added `useTheme` from `next-themes`; added `ToolCallbacks` type import from voice-controller.
2. Extended `VoiceSessionContextType` with `registerToolCallbacks: (callbacks: ToolCallbacks) => void`.
3. Added `toolCallbacksRef = useRef<ToolCallbacks>({})` and `registerToolCallbacks` (wrapped in `useCallback([], [])` for stable reference).
4. Added `useEffect([resolvedTheme, setTheme])` that wires `toggleTheme` and `openLink` directly onto `toolCallbacksRef.current` — these never need per-page registration.
5. Passed `toolCallbacks: toolCallbacksRef.current` to `useVoiceController`; added `registerToolCallbacks` to context value.

### Task 2 — voice-controller.ts signals and race fix

`src/lib/voice-controller.ts` received two targeted changes:

1. **dispatchToolCall**: Each of the four tool cases (`openProject`, `scrollTo`, `openLink`, `toggleTheme`) now emits `VoiceBus.emit('tool-executing')` before the callback and `VoiceBus.emit('tool-success')` after. The missing-callback branch emits `VoiceBus.emit('tool-error')` after the console.warn. `navigate` and `endCall` are excluded (internal only).

2. **waitForPage + startTour**: New `waitForPage(targetPage)` helper added as a `useCallback([], [])`. It subscribes to `VoiceBus.on('page-ready', ...)` and resolves when the target page emits the event, with a 1500ms `setTimeout` fallback via `Promise.race`. `startTour` now calls `await waitForPage(step.page)` instead of `await new Promise<void>((r) => setTimeout(r, 500))`. `waitForPage` added to `startTour` dependency array.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all wiring is complete. `page-ready` event emission from pages is the responsibility of Phase 13 plan 02+, but `waitForPage` gracefully falls back to 1500ms until those plans land.

## Threat Flags

None. `openLink` already enforces `noopener,noreferrer` as specified in T-13-01. VoiceBus events are internal-only (T-13-03 accepted).

## Self-Check: PASSED

- `src/providers/voice-session-provider.tsx` — exists and contains `registerToolCallbacks`
- `src/lib/voice-controller.ts` — exists and contains `waitForPage` and `tool-executing` signals
- Commit `8d0f434` — verified in git log
- Commit `eb2fe56` — verified in git log
- `npx tsc --noEmit` — exits 0, no errors
