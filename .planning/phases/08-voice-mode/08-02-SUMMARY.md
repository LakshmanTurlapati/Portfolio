---
phase: 08-voice-mode
plan: 02
subsystem: ui, api
tags: [voice, speech-recognition, elevenlabs, tts, audio, web-speech-api, state-machine, react-hook, typescript, localStorage]

# Dependency graph
requires:
  - phase: 08-voice-mode
    plan: 01
    provides: window.VoiceBus singleton (state machine + audio analysis + pub/sub), /api/tts ElevenLabs proxy
provides:
  - useVoiceController hook — full voice session state machine (STT, TTS, AI, tour, barge-in, memory, accessibility)
  - matchNavIntent regex router — navigation intent detection
  - TOUR_STEPS array — 5-step scripted portfolio tour
  - isTourIntent, isStopIntent, isTextModeIntent intent predicates
affects:
  - 08-03 (NavbarVoicePanel and VoiceWave use voiceProps from useVoiceController)
  - 08-04 (particle breathing rAF triggered by VoiceBus.level, which controller drives)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useCallback with [] deps for stable refs — speak, stopAll, handleUserTurn, startListening all use useCallback"
    - "activeRef shadow ref pattern — keeps activeRef.current in sync with active state for use inside async callbacks"
    - "Web Speech API accessed via (window as any).SpeechRecognition || webkitSpeechRecognition — avoids TS DOM lib gaps"
    - "streamTTS returns Promise<void> resolving on source.onended — enables sequential tour step await"
    - "AI SDK SSE stream parsing — reads '0:' prefixed lines from /api/chat streaming response"

key-files:
  created:
    - src/lib/voice-commands.ts
    - src/lib/voice-controller.ts
  modified: []

key-decisions:
  - "SpeechRecognition typed as 'any' — TypeScript DOM lib does not fully expose SpeechRecognition/SpeechRecognitionEvent/SpeechRecognitionErrorEvent even with 'dom' lib target"
  - "streamTTS Promise wraps source.onended for sequential tour step execution — simpler than event emitter pattern"
  - "prefersReduced exported in return value — caller (Plan 03 navbar) can skip GSAP morph without re-querying media query"
  - "dispatchToolCall is a useCallback inside the hook body (not exported) — single dispatch point for all tool calls; openProject wired via toolCallbacks, others console.warn on miss"
  - "AI chat response parsed from SSE '0:' prefix lines — matches ai-sdk/react stream format from /api/chat"

patterns-established:
  - "Pattern: voice intent routing — isStopIntent → isTextModeIntent → isTourIntent → matchNavIntent → AI, checked in order"
  - "Pattern: barge-in via VoiceBus 'level' subscription — level > 0.15 during speaking state triggers bargeIn()"
  - "Pattern: ToolCallbacks optional fields with console.warn fallback — un-wired tools log warning, never silently no-op"

requirements-completed: [VOIC-02, VOIC-04, VOIC-05]

# Metrics
duration: 3min
completed: 2026-04-24
---

# Phase 8 Plan 02: Voice Session Logic Summary

**useVoiceController hook with Web Speech API STT, ElevenLabs TTS via /api/tts, Grok AI agent loop, regex nav routing, 5-step scripted tour with dispatchToolCall, energy-threshold barge-in, 20-message localStorage history, Space/Esc keyboard shortcuts, and prefers-reduced-motion cap**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-24T06:30:59Z
- **Completed:** 2026-04-24T06:33:57Z
- **Tasks:** 2
- **Files modified:** 2 (2 created, 0 modified)

## Accomplishments
- voice-commands.ts: matchNavIntent regex router ported verbatim from voice_mode.jsx, TOUR_STEPS array (5 steps from VOICE_HANDOFF.md section 4), isTourIntent/isStopIntent/isTextModeIntent predicates — pure TypeScript utility, no React
- voice-controller.ts: useVoiceController hook with complete session state machine: STT via Web Speech API with webkitSpeechRecognition fallback, ElevenLabs TTS via /api/tts with AudioBufferSourceNode + live RMS analysis, SpeechSynthesis fallback when TTS fails
- dispatchToolCall helper routes openProject (wired via toolCallbacks), scrollTo/openLink/toggleTheme (console.warn on miss), navigate/endCall (handled internally) — tour step 4 (Parz-AI) correctly dispatches openProject when toolCallbacks.openProject is provided
- startTour iterates TOUR_STEPS sequentially, awaiting each speak() before advancing, with 500ms page-settle delay on page change
- Energy-threshold barge-in: VoiceBus 'level' subscription cancels audioSourceRef on level > 0.15 during speaking state; prefers-reduced-motion caps effective level to 0.2 before threshold check
- Rolling 20-message history persisted to localStorage 'pf-voice-history' (loaded on mount, flushed on close)
- Space push-to-talk + Esc close keyboard shortcuts registered when voice mode is active, cleaned up on deactivation

## Task Commits

Each task was committed atomically:

1. **Task 1: voice-commands.ts — matchNavIntent and TOUR_STEPS** - `8bfd691` (feat)
2. **Task 2: voice-controller.ts — full session hook** - `bf22e29` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/lib/voice-commands.ts` - matchNavIntent regex router, TOUR_STEPS array, isTourIntent/isStopIntent/isTextModeIntent predicates
- `src/lib/voice-controller.ts` - useVoiceController hook — complete voice session state machine

## Decisions Made
- SpeechRecognition typed as `any` because TypeScript's DOM lib does not fully expose `SpeechRecognition`, `SpeechRecognitionEvent`, or `SpeechRecognitionErrorEvent` even when `"lib": ["dom"]` is set — the types are non-standard and require separate `@types/dom-speech-recognition` or any-casting
- `streamTTS` returns `Promise<void>` that resolves on `source.onended` — enables `await speak(step.say)` pattern in `startTour` without additional event emitter complexity
- `prefersReduced` exported in the hook return value so Plan 03 navbar component can skip GSAP morph animation without re-querying the media query
- AI SDK streaming response parsed by reading `0:` prefixed SSE lines and JSON-parsing the payload — matches the ai-sdk/react stream format emitted by the existing `/api/chat` route

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] SpeechRecognition types not in TypeScript DOM lib**
- **Found during:** Task 2 (TypeScript verification after creating voice-controller.ts)
- **Issue:** TypeScript DOM lib (`"lib": ["dom"]`) does not expose `SpeechRecognition`, `SpeechRecognitionEvent`, or `SpeechRecognitionErrorEvent` as named types — TS2304 and TS2552 errors
- **Fix:** Used `(window as any).SpeechRecognition || (window as any).webkitSpeechRecognition` for the constructor, and typed recognition event callbacks as `(e: any)` with eslint-disable comments
- **Files modified:** src/lib/voice-controller.ts
- **Verification:** `npx tsc --noEmit` exits 0
- **Committed in:** bf22e29 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — TypeScript type correctness)
**Impact on plan:** Required for TypeScript correctness. Runtime behavior identical to plan intent. No scope creep.

## Issues Encountered
- Web Speech API TypeScript declarations are incomplete in the standard DOM lib — `@types/dom-speech-recognition` package exists as an alternative but was not added to avoid scope creep; `any` cast is sufficient for this use case.

## User Setup Required
None — voice-controller.ts depends on window.VoiceBus (provided by Plan 01) and /api/tts (provided by Plan 01). No additional configuration required for Plan 02 artifacts.

## Next Phase Readiness
- `useVoiceController` is ready: Plan 03 (NavbarVoicePanel) can import and use the hook by passing `goPage`, `openTextChat`, `currentPage`, and optionally `toolCallbacks`
- `matchNavIntent` and `TOUR_STEPS` are ready: available for import from `src/lib/voice-commands`
- `dispatchToolCall` for `openProject` requires the consumer to pass `toolCallbacks={{ openProject: (args) => router.push('/portfolio/' + args.slug) }}` (or equivalent) for tour step 4 to open the Parz-AI project
- TypeScript compiles clean — no downstream type errors expected

## Known Stubs
None — voice-controller.ts wires all state machine logic. The hook cannot be visually verified without the NavbarVoicePanel UI (Plan 03).

---
*Phase: 08-voice-mode*
*Completed: 2026-04-24*
