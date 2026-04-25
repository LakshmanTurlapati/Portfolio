---
phase: 14-elevenlabs-stt-upgrade
plan: "02"
subsystem: voice-stt-controller
tags: [elevenlabs, stt, scribe, voice-controller, fallback, barge-in]
dependency_graph:
  requires:
    - /api/stt-token route (from 14-01)
  provides:
    - ElevenLabs Scribe v2 primary STT in voice-controller.ts
    - Web Speech API silent fallback (startListeningFallback)
  affects:
    - src/lib/voice-controller.ts
tech_stack:
  added:
    - "@elevenlabs/client v1.3.1 (browser-safe Scribe STT SDK)"
  patterns:
    - Async startListening() with try-ElevenLabs-then-fallback-to-WebSpeech
    - Token fetch before WebSocket open (single-use, never cached)
    - sttCtx AudioContext created before first await (AudioContext autoplay policy compliance)
    - void guard on async call sites in sync contexts (bargeIn, keydown handler)
    - connectionRef typed as RealtimeConnection | null (replaces any-typed recogRef)
key_files:
  created: []
  modified:
    - src/lib/voice-controller.ts
decisions:
  - startListeningFallback declared before startListening — required because startListening's useCallback dep array includes startListeningFallback
  - sttCtx created synchronously before first await — satisfies AudioContext autoplay policy (Pitfall 3 from RESEARCH.md)
  - void guard used (not .catch) on startListening call sites — consistent with existing codebase style
  - Barge-in threshold raised from 0.15 to 0.35 — ElevenLabs TTS amplitude is consistently higher than Web Speech API synthesis
  - Silent fallback (no user notification) on ElevenLabs ERROR event — per D-02 locked decision
metrics:
  duration: "320s"
  completed: "2026-04-25T23:15:20Z"
  tasks_completed: 1
  tasks_total: 1
  files_created: 0
  files_modified: 1
---

# Phase 14 Plan 02: ElevenLabs Scribe v2 STT in voice-controller.ts Summary

**One-liner:** ElevenLabs Scribe v2 replaces Web Speech API as primary STT in voice-controller.ts, with token-per-session fetch and silent Web Speech API fallback.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Install @elevenlabs/client and update voice-controller.ts | a1da8c0 | src/lib/voice-controller.ts, package.json, package-lock.json |

## What Was Built

**Task 1 — voice-controller.ts ElevenLabs Scribe v2 integration:**

- Installed `@elevenlabs/client` v1.3.1 with `--legacy-peer-deps` (pre-existing peer conflict with @ai-sdk/react and react@19.1.0)
- Added imports: `Scribe`, `RealtimeEvents`, `CommitStrategy` from `@elevenlabs/client`; `RealtimeConnection` type
- Renamed `recogRef: useRef<any>(null)` → `connectionRef: useRef<RealtimeConnection | null>(null)` — zero remaining `recogRef` references
- Updated `stopAll()`: `recogRef.current?.stop()` → `connectionRef.current?.close(); connectionRef.current = null`
- Extracted existing Web Speech API `startListening()` body verbatim into `startListeningFallback()` (declared first per dependency order rule)
- Replaced `startListening()` with async ElevenLabs primary path:
  - Creates `sttCtx = new AudioContext({ sampleRate: 16000 })` before first `await` (AudioContext autoplay policy)
  - Fetches single-use token from `/api/stt-token` (POST, no caching)
  - Calls `Scribe.connect()` with VAD commit strategy, 1.2s silence threshold, mic options
  - Wires `SESSION_STARTED` (attachMic for RMS), `PARTIAL_TRANSCRIPT` (setCaption/setTranscript), `COMMITTED_TRANSCRIPT` (handleUserTurn), `AUTH_ERROR` (setMicDenied), `ERROR` (silent fallback), `CLOSE` (cleanup)
  - On any catch: closes sttCtx, calls `startListeningFallback()` silently (per D-02)
- Added `void startListening()` guard in `bargeIn()` and Space `keydown` handler
- Updated Space `keyup` handler: `recogRef.current?.stop()` → `connectionRef.current?.close(); connectionRef.current = null`
- Raised barge-in threshold: `effectiveLevel > 0.15` → `effectiveLevel > 0.35` (prevents self-interruption of ElevenLabs TTS)

## Verification Results

1. `grep -c "recogRef" src/lib/voice-controller.ts` → **0** (complete rename)
2. `grep "Scribe.connect" src/lib/voice-controller.ts` → shows connection setup line
3. `grep -c "startListeningFallback" src/lib/voice-controller.ts` → **5** (declaration + 2 call sites + dep array + comment)
4. `grep "0.35" src/lib/voice-controller.ts` → shows raised barge-in threshold
5. `npx tsc --noEmit` → exits 0 (no TypeScript errors)
6. `npm run build` → exits 0 (compiled successfully, /api/stt-token listed as dynamic route)

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — voice-controller.ts is a complete implementation. The ElevenLabs path fetches a live token from /api/stt-token and opens a real Scribe WebSocket. The fallback path is fully functional Web Speech API code.

## Threat Flags

No new security surface beyond what the plan's threat model covers (T-14-04, T-14-05, T-14-06). Token stored only in local `token` const (not state, not localStorage), connectionRef holds WebSocket handle only.

## Self-Check: PASSED

- FOUND: src/lib/voice-controller.ts (modified)
- FOUND commit: a1da8c0 (Task 1)
- FOUND: `grep -c "recogRef" src/lib/voice-controller.ts` → 0
- FOUND: `grep "Scribe.connect"` → connection setup present
- FOUND: TypeScript clean, build successful
