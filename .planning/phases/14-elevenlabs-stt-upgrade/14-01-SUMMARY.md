---
phase: 14-elevenlabs-stt-upgrade
plan: "01"
subsystem: voice-stt-infrastructure
tags: [elevenlabs, stt, audioworklet, api-route, security]
dependency_graph:
  requires: []
  provides:
    - /api/stt-token route (single-use Scribe token endpoint)
    - /pcm-processor.js AudioWorklet (PCM16 capture fallback)
  affects:
    - src/app/api/stt-token/route.ts
    - public/pcm-processor.js
tech_stack:
  added:
    - ElevenLabsClient.tokens.singleUse.create() API via @elevenlabs/elevenlabs-js
    - AudioWorklet PCM16 processor pattern (plain JS, no imports, Transferable postMessage)
  patterns:
    - Server-side token minting (API key never in browser bundle)
    - hasEnvVar() guard with Response.json() shorthand for clean error shapes
    - AudioWorklet isolated audio thread scope (no ESM/require allowed)
key_files:
  created:
    - src/app/api/stt-token/route.ts
    - public/pcm-processor.js
  modified: []
decisions:
  - Response.json() shorthand used in stt-token route (lighter than new Response + JSON.stringify + headers)
  - POST handler has no req parameter since token minting takes no request body
  - pcm-processor.js placed in public/ so Next.js serves it at /pcm-processor.js (required for audioWorklet.addModule URL)
metrics:
  duration: "73s"
  completed: "2026-04-25T23:10:58Z"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 0
---

# Phase 14 Plan 01: STT Token Endpoint and PCM AudioWorklet Summary

**One-liner:** Server-side Scribe token endpoint and PCM16 AudioWorklet processor forming the STT infrastructure for ElevenLabs upgrade.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create /api/stt-token route | e3fd4d9 | src/app/api/stt-token/route.ts |
| 2 | Create public/pcm-processor.js AudioWorklet | 9422845 | public/pcm-processor.js |

## What Was Built

**Task 1 — /api/stt-token route:**
- Next.js App Router Route Handler at `src/app/api/stt-token/route.ts`
- Follows the exact same pattern as `/api/tts/route.ts` (hasEnvVar guard, ElevenLabsClient, try/catch)
- POST handler with no `req` parameter (token minting requires no request body)
- Returns 503 when `ELEVENLABS_API_KEY` is not set, 500 on API errors, 200 with `{ token: string }` on success
- Uses `Response.json()` shorthand for clean error shapes
- ELEVENLABS_API_KEY never appears in response body or browser-visible payload
- Calls `client.tokens.singleUse.create('realtime_scribe')` — 15-minute single-use Scribe token

**Task 2 — PCM16 AudioWorklet:**
- Plain JavaScript at `public/pcm-processor.js` (no ESM, no require — AudioWorklet isolated audio thread constraint)
- Served by Next.js at `/pcm-processor.js` — correct URL for `sttCtx.audioWorklet.addModule('/pcm-processor.js')`
- `PCMProcessor` class extends `AudioWorkletProcessor`, registers as `'pcm-processor'`
- Converts Float32 mic samples to Int16 PCM16 format (clamped to [-1, 1] range)
- Uses `this.port.postMessage(int16.buffer, [int16.buffer])` with Transferable for zero-copy buffer transfer
- Returns `true` from `process()` to keep processor alive

## Verification Results

1. `ls src/app/api/stt-token/route.ts` — file exists
2. `npx tsc --noEmit` — no TypeScript errors
3. `grep NEXT_PUBLIC src/app/api/stt-token/route.ts` — nothing (key never public)
4. `grep "registerProcessor" public/pcm-processor.js` — confirms registration
5. `npm run build` — succeeded, /api/stt-token listed as dynamic route (ƒ)

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — both files are complete implementations with no placeholder data.

## Threat Flags

No new security surface beyond what the plan's threat model covers. The /api/stt-token endpoint is documented in T-14-01, T-14-02, T-14-03.

## Self-Check: PASSED

- FOUND: src/app/api/stt-token/route.ts
- FOUND: public/pcm-processor.js
- FOUND commit: e3fd4d9 (Task 1)
- FOUND commit: 9422845 (Task 2)
