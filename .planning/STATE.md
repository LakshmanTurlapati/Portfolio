---
gsd_state_version: 1.0
milestone: v4.2
milestone_name: Carry-forward Polish & Hardening
status: defining_requirements
stopped_at: null
last_updated: "2026-04-26T12:00:00.000Z"
last_activity: 2026-04-26 -- v4.2 milestone started (defining requirements)
progress:
  total_phases: 0
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
milestone_status: active
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-26)

**Core value:** A visually striking, interactive portfolio that showcases projects with rich detail, ambient animations, and an AI persona.
**Current focus:** v4.2 Carry-forward Polish & Hardening -- closing v4.1 deferred items (voice Wave 2 fixes, mobile UX gaps, FSB overlay polish, chat UI redesign, optional API-03).

## Current Position

Phase: Not started (defining requirements)
Plan: --
Status: Defining requirements
Last activity: 2026-04-26 -- Milestone v4.2 started

```
v4.2 Progress: [--------------------] 0% (defining requirements)
```

## Performance Metrics

**Velocity:**

- Total plans completed: 57+ from previous milestones (v1.0 through v4.1)
- Average duration: tracked during execution
- Total execution time: tracked during execution

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 16-24 | 9 | 14 | -- |

## Accumulated Context

### Decisions

- [v4.1-roadmap]: Continue numbering from v4.0; v4.1 starts at Phase 16 and ends at Phase 20.
- [v4.1-roadmap]: Coarse granularity compresses the milestone into five delivery boundaries: public-safe brain/content, browser path, global control, overlay, verification.
- [v4.1-current-work]: Public-safe role context is AI Enablement Engineer at InfiniteChoice building Voyza, an AI-first hotel booking platform; keep brief and avoid internal details.
- [v4.1-flagships]: FSB / Full Self Browsing and GitFly are current flagships; GitFly links only to https://gitfly.ai because source is private.
- [v4.1-project-ui]: Remove the right-side ProjectDetail primary path; project opening should use the inbuilt browser directly from manual cards and Parz commands.
- [phase-17]: Project aliases and preferred targets live in local project records; project opening resolves through local records before opening approved browser targets.
- [phase-17]: GitFly opens only `https://gitfly.ai`; no private source URL is exposed.
- [phase-19]: FSB control overlay lifecycle lives in `SiteControlProvider` so text and voice Parz control actions share one visible feedback path.
- [phase-19]: FSB overlay is pointer-safe, monochrome, and uses exact badge copy `powered by FSB` while preserving browser, voice, nav, and scroll controls.
- [phase-20]: v4.1 verification uses deterministic local Vitest contract tests and a focused Playwright E2E test instead of live Grok, ElevenLabs, Amplify, or custom-domain dependencies.
- [phase-20]: Playwright runs the portfolio dev server on port 3100 to avoid accidentally reusing unrelated local apps on port 3000.
- [phase-21]: No hardcoded tour. Tours are LLM-driven via existing `navigate` / `openProject` / `scrollTo` tool calls, paced one step per turn through chat-route instructions. The only remaining hardcoded trigger in the voice path is `isStopIntent`, kept for instant abort without a network round-trip.
- [phase-21]: Wave 2 (P1 audit findings -- STT/TTS timeouts, callback registration, exception wrapping, openTextChat 400ms race) is intentionally out of scope for v4.1. Tracked in `21-AUDIT.md` for v4.2.
- [phase-22]: Single `cancelAllAudio` primitive owns all in-flight TTS teardown (BufferSource, SpeechSynthesis queue, `/api/tts` fetch via `AbortController`, RMS loop, Promise resolver). It does NOT mutate `VoiceBus.state`; the caller decides the new state.
- [phase-22]: `BufferSource.onended` and `SpeechSynthesisUtterance.onend` now identity-check against ref-tracked current values so a cancelled handler can never reset state on top of a newer speak.
- [phase-22]: `handleUserTurn` increments `turnGenerationRef` and bails at the post-SSE-parse checkpoint when a newer turn arrives.
- [phase-23]: Voice output is 100% LLM-generated. Greet on open is no longer hardcoded -- `handleUserTurn(trigger, { kind: 'greet' })` sends a synthetic kickoff to the LLM. Empty-response and server-error fallbacks are silent (UI caption only).
- [phase-23]: Phase-22 R-1 regression hotfix shipped. Barge-in `useEffect` now also checks `window.VoiceBus._liveAudio === true`, so phantom default-level emissions no longer fire barge-in.
- [phase-24]: Voice TTS unstick -- pre-warm `VoiceBus._getCtx()` synchronously inside `open()`'s click frame so AudioContext is created in user-gesture context. Await `ctx.resume()` in `streamTTS` if state is suspended. Always exit 'thinking' on empty-text response.
- [phase-24]: Mobile navbar -- `AskParzButton` got a `variant: 'desktop' | 'mobile'` prop. `PortfolioButton` mobile image reduced from 112x28 to 64x16 with `overflow-hidden`.
- [phase-24]: iOS safe-area required `viewport: { viewportFit: 'cover' }` in `app/layout.tsx`. Without that meta, iOS Safari refuses to expose `env(safe-area-inset-*)` and every safe-area formula resolves to 0.

### v4.2 Carry-forward Investigation (file:line evidence, verified 2026-04-26 against `e2a1383`)

- [v4.2-F-05]: `src/providers/voice-session-provider.tsx:82` -- hardcoded 400ms setTimeout still races View Transitions (~500ms). Fix: replace with VoiceBus `page-ready` event listener. Complexity: S.
- [v4.2-F-06]: `src/lib/voice-controller.ts:693` -- no timeout guard if Scribe stalls before `SESSION_STARTED`. Fix: add 5s guard timer that calls `startListeningFallback()`. Complexity: M.
- [v4.2-F-07]: `src/lib/voice-controller.ts:343` -- SpeechSynthesis fallback has no worst-case timeout (Safari can drop silently). Fix: timeout proportional to text length (~50ms/char + 1s floor). Complexity: M.
- [v4.2-F-08]: `src/providers/voice-session-provider.tsx:43` -- `registerToolCallbacks` accumulates stale handlers, no deregister. Fix: return deregister fn from `registerToolCallbacks`, call on unmount. Complexity: S.
- [v4.2-F-09]: `src/lib/voice-controller.ts:125` -- tool callback throws bubble out and abort the voice turn. Fix: factor `runTool()` helper with try/catch, emit `tool-error` on throw. Complexity: S.
- [v4.2-particles]: `src/components/particle-background.tsx:84` -- 90 particles hardcoded, no mobile gate, continuous breathing rAF. Fix: detect mobile, reduce count to ~40-50, optionally gate breathing rAF. Complexity: S.
- [v4.2-chat-ios]: `src/components/chat-popup.tsx:505` -- input has no `inputMode`, no focus-scroll, no safe-area on input padding. Complexity: S.
- [v4.2-project-detail-mobile]: `src/components/project-detail.tsx` -- `px-14` and `mx-14` cramp mobile layout. Fix: responsive `px-4 lg:px-14`. Complexity: M.
- [v4.2-FSB-04]: `src/components/fsb-control-overlay.tsx:29` -- only static "powered by FSB" badge; needs `tool-executing` VoiceBus subscription to render dynamic action captions. Complexity: M.
- [v4.2-FSB-05]: `src/components/fsb-control-overlay.tsx` -- no mobile breakpoint; grid + badge render identically across viewports. Fix: hide grid on mobile, swap component per breakpoint. Complexity: S.
- [v4.2-CHAT-UI-01]: `src/components/chat-popup.tsx` -- functional and shipped. This is design-driven visual/UX polish, not a bug. Benefits from a UI-SPEC phase. Complexity: L (design-driven).
- [v4.2-API-03]: `scripts/verify-amplify-apis.mjs` -- script is ready and rejects Fly URLs by design. Blocked on a reachable Amplify deployment, not code.

### Pending Todos

- API-03 remains gated on a reachable Amplify/custom-domain production URL. Include in v4.2 only if URL becomes available; otherwise re-defer.

### Blockers/Concerns

- Live Amplify/custom-domain API smoke testing is gated on `audienclature.com` or the actual Amplify URL becoming publicly reachable.

## Session Continuity

Last session: v4.2 milestone start
Stopped at: Milestone v4.2 started, defining requirements
Resume file: --

**Next:** Continue `/gsd-new-milestone` flow -- research decision, then requirements, then roadmap.

**Completed Milestone:** v4.1 Parz Persona, Portfolio Context, and Site Control Refresh -- 9 phases, 14 plans -- 2026-04-26
**Completed Phase:** 24 (Mobile Pass + Voice Stabilization) -- 1 plan -- 2026-04-26T07:10:00.000Z
**Completed Phase:** 23 (Dynamic Voice Output + R-1 Hotfix) -- 1 plan -- 2026-04-26T01:15:00.000Z
**Completed Phase:** 22 (Voice Audio Serialization) -- 1 plan -- 2026-04-26T00:50:00.000Z
**Completed Phase:** 21 (Voice Audit and Wave 1 Fixes) -- 1 plan -- 2026-04-26T00:25:00.000Z
**Completed Phase:** 20 (Verification and Regression Coverage) -- 1 plan -- 2026-04-26T04:03:00.000Z
**Completed Phase:** 19 (FSB-Inspired Control Overlay) -- 1 plan -- 2026-04-26T03:45:00.000Z
**Completed Phase:** 17 (Direct Inbuilt Project Browser) -- 2 plans -- 2026-04-26T03:25:00.000Z
