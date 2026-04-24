---
phase: 08-voice-mode
plan: 01
subsystem: api, ui
tags: [voice, elevenlabs, tts, voicebus, pubsub, react-context, typescript, window-global]

# Dependency graph
requires:
  - phase: 01-app-shell-and-navigation
    provides: layout.tsx provider stack pattern, src/lib/env.ts hasEnvVar utility
  - phase: 06-home-page-and-ambient-backgrounds
    provides: TransitionProvider pattern for React context mirrors
provides:
  - window.VoiceBus singleton (state machine + audio analysis + pub/sub)
  - VoiceBusProvider React context (state enum mirror for component tree)
  - useVoiceBus() hook for any client component to read VoiceState
  - POST /api/tts ElevenLabs streaming proxy (server-side key, audio/mpeg)
affects:
  - 08-02 (voice controller, STT, navbar morph — all depend on window.VoiceBus + /api/tts)
  - 08-03 (particle breathing rAF reads window.VoiceBus.level directly)
  - 08-04 (NavbarVoicePanel uses useVoiceBus() via VoiceBusProvider)

# Tech tracking
tech-stack:
  added:
    - "@elevenlabs/elevenlabs-js (2.44.0) — ElevenLabs TTS SDK, server-side only"
  patterns:
    - "window global + React context hybrid: VoiceBus owns level (60fps rAF-safe) while VoiceBusProvider mirrors state enum for React re-renders"
    - "initVoiceBus() called at module scope in provider (not in useEffect) to guarantee availability before any React tree mounts"
    - "VoiceState and VoiceBusInstance declared inside declare global{} block to make them globally accessible across all modules"
    - "ElevenLabs stream() return value passed directly to Response() to avoid TypeScript async-iterable issues on ES2017 target"

key-files:
  created:
    - src/types/voice-bus.d.ts
    - src/lib/voice-bus-init.ts
    - src/providers/voice-bus-provider.tsx
    - src/hooks/use-voice-bus.ts
    - src/app/api/tts/route.ts
    - .env.local.example
  modified:
    - src/app/layout.tsx

key-decisions:
  - "VoiceState type placed inside declare global{} (not module-scope) so all .ts files see it without explicit import"
  - "ElevenLabs stream() return (ReadableStream<Uint8Array>) cast to ReadableStream and passed directly to Response() — avoids for-await-of which fails on ES2017 TypeScript target"
  - "npm install used --legacy-peer-deps due to pre-existing ai-sdk/react peer conflict with react@19.1.0 (not introduced by this plan)"
  - "voice ID dMWVPH9DSxWOMrrrUso3 is allowlisted: any other voiceId in POST body is silently overwritten per D-02 threat mitigation"

patterns-established:
  - "Pattern: VoiceBus hybrid — window.VoiceBus for rAF-safe audio data, React context for state enum only"
  - "Pattern: initVoiceBus() at module scope in provider — ensures singleton before any useEffect subscription"

requirements-completed: [VOIC-01, VOIC-03, VOIC-04]

# Metrics
duration: 3min
completed: 2026-04-24
---

# Phase 8 Plan 01: VoiceBus Foundation and TTS Infrastructure Summary

**window.VoiceBus singleton pub/sub with RMS audio analysis, React VoiceBusProvider context mirror, and ElevenLabs streaming TTS proxy at /api/tts with server-side key isolation**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-24T06:24:33Z
- **Completed:** 2026-04-24T06:27:40Z
- **Tasks:** 2
- **Files modified:** 7 (6 created, 1 modified)

## Accomplishments
- window.VoiceBus singleton initialized via initVoiceBus(), porting all prototype methods verbatim (on/off/emit/setState/setLevel/_getCtx/_startLoop/_stopLoop/attachMic/attachTTSFake)
- VoiceBusProvider React context mirrors VoiceBus.state enum via useEffect subscription; useVoiceBus() hook available to any child component
- POST /api/tts proxies ElevenLabs eleven_turbo_v2_5 with ELEVENLABS_API_KEY server-side only, voice ID allowlisted, text capped at 500 chars, 503 when key absent

## Task Commits

Each task was committed atomically:

1. **Task 1: VoiceBus types, init module, and provider** - `2e41e01` (feat)
2. **Task 2: ElevenLabs TTS proxy route + layout wiring + package install** - `58bfd63` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/types/voice-bus.d.ts` - Global VoiceState type + VoiceBusInstance interface + Window augmentation
- `src/lib/voice-bus-init.ts` - initVoiceBus() singleton exporting full prototype port
- `src/providers/voice-bus-provider.tsx` - VoiceBusProvider + useVoiceBus() with module-scope init
- `src/hooks/use-voice-bus.ts` - Convenience re-export of useVoiceBus from provider
- `src/app/api/tts/route.ts` - ElevenLabs streaming proxy with security controls
- `src/app/layout.tsx` - Added VoiceBusProvider as innermost provider wrapper
- `.env.local.example` - Documents ELEVENLABS_API_KEY and XAI_API_KEY for developers

## Decisions Made
- `VoiceState` and `VoiceBusInstance` placed inside `declare global {}` block in the `.d.ts` so they are universally accessible across all TypeScript modules without explicit imports — the original plan spec had them at module scope which caused TS2304 errors.
- ElevenLabs `textToSpeech.stream()` return value (`ReadableStream<Uint8Array>`) is cast and passed directly to `new Response()` rather than iterated with `for await...of` — the ES2017 TypeScript target does not include `ReadableStream` as `AsyncIterable`, so `for await` caused a TS2504 error.
- `npm install --legacy-peer-deps` used for ElevenLabs package due to a pre-existing peer conflict in the project (`@ai-sdk/react@3.0.147` requires `react@^18 || ~19.0.1 || ~19.1.2 || ^19.2.1` but project has `react@19.1.0`).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] VoiceState global type declaration moved inside declare global{}**
- **Found during:** Task 1 (TypeScript verification after creating voice-bus-init.ts)
- **Issue:** Plan spec placed `type VoiceState` and `interface VoiceBusInstance` at module scope in the `.d.ts`, but the `export {}` makes the file a module, so those declarations are module-scoped — not globally accessible. voice-bus-init.ts could not resolve `VoiceState` (TS2304).
- **Fix:** Moved both `VoiceState` and `VoiceBusInstance` inside `declare global {}` in voice-bus.d.ts.
- **Files modified:** src/types/voice-bus.d.ts
- **Verification:** `npx tsc --noEmit` exits 0
- **Committed in:** 2e41e01 (Task 1 commit)

**2. [Rule 1 - Bug] ElevenLabs stream piped directly to Response instead of for-await-of**
- **Found during:** Task 2 (TypeScript verification after creating route.ts)
- **Issue:** `for await (const chunk of audioStream)` failed with TS2504 because `ReadableStream<Uint8Array>` does not implement `AsyncIterable` in the ES2017 TypeScript lib target.
- **Fix:** Cast `audioStream` as `ReadableStream` and pass it directly to `new Response()` — the Node.js/Next.js runtime accepts `ReadableStream` as a Response body natively.
- **Files modified:** src/app/api/tts/route.ts
- **Verification:** `npx tsc --noEmit` exits 0; `npm run build` succeeds with `/api/tts` listed as dynamic route.
- **Committed in:** 58bfd63 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2x Rule 1 — TypeScript type correctness)
**Impact on plan:** Both fixes required for TypeScript correctness. No scope creep. Runtime behavior is identical to plan intent.

## Issues Encountered
- Pre-existing npm peer dependency conflict (`@ai-sdk/react` vs `react@19.1.0`) required `--legacy-peer-deps` for ElevenLabs installation. Not a new issue introduced by this plan. A `.npmrc` with `legacy-peer-deps=true` would prevent future friction — deferred.

## User Setup Required
- Add `ELEVENLABS_API_KEY=<your-key>` to `.env.local` for local development (see `.env.local.example`)
- Add `ELEVENLABS_API_KEY` in AWS Amplify Console environment variables for production
- Without the key, `/api/tts` returns 503 — voice TTS will not function but the site remains fully operational

## Next Phase Readiness
- window.VoiceBus is ready: all downstream plans can call `window.VoiceBus.setState()`, `attachMic()`, `attachTTSFake()`, and subscribe to `'state'`/`'level'` events
- /api/tts is ready: any client can POST `{text, voiceId}` to get streaming audio/mpeg
- VoiceBusProvider is in the provider stack: `useVoiceBus()` works in any client component
- Plan 02 (voice controller + STT + navbar morph) can proceed immediately

---
*Phase: 08-voice-mode*
*Completed: 2026-04-24*
