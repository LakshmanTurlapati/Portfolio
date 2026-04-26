---
gsd_state_version: 1.0
milestone: v4.1
milestone_name: Parz Persona, Portfolio Context, and Site Control Refresh
status: complete
stopped_at: Phase 23 complete
last_updated: "2026-04-26T01:15:00.000Z"
last_activity: 2026-04-26 -- Phase 23 complete (dynamic voice output + R-1 hotfix)
progress:
  total_phases: 8
  completed_phases: 8
  total_plans: 13
  completed_plans: 13
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-26)

**Core value:** A visually striking, interactive portfolio that showcases projects with rich detail, ambient animations, and an AI persona.
**Current focus:** v4.1 milestone phases complete (incl. retroactive audit-driven Phases 21, 22, 23) — ready for milestone audit/completion

## Current Position

Phase: 23
Plan: Complete
Status: Complete
Last activity: 2026-04-26 -- Phase 23 complete (dynamic voice output + R-1 hotfix)

```
v4.1 Progress: [████████████████████] 100% complete (8 / 8 phases)
```

## Performance Metrics

**Velocity:**

- Total plans completed: 43+ from previous milestones
- Average duration: tracked during execution
- Total execution time: tracked during execution

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 16-23 | 8 | TBD | TBD |
| 16 | 3 | 3 | - |
| 17 | 2 | 2 | - |
| 18 | 3 | - | - |
| 19 | 1 | 1 | - |
| 20 | 1 | 1 | - |
| 21 | 1 | 1 | - |
| 22 | 1 | 1 | - |
| 23 | 1 | 1 | - |

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
- [phase-21]: Filed retroactively after the user authorized off-roadmap edits ("continue the wave in autonomous mode"). The audit deliverable was produced before the plan; plan and summary describe the work as it actually happened.
- [phase-21]: Wave 2 (P1 audit findings — STT/TTS timeouts, callback registration, exception wrapping, openTextChat 400ms race) is intentionally out of scope. Tracked in `21-AUDIT.md` for a future phase.
- [phase-22]: User reported "overlapping voices" after Phase 21 shipped; second mini-audit catalogued five overlap modes (O-1..O-5, see `22-AUDIT.md`) — none of which were touched by Wave 1.
- [phase-22]: Single `cancelAllAudio` primitive owns all in-flight TTS teardown (BufferSource, SpeechSynthesis queue, `/api/tts` fetch via `AbortController`, RMS loop, Promise resolver). It does NOT mutate `VoiceBus.state`; the caller decides the new state.
- [phase-22]: `BufferSource.onended` and `SpeechSynthesisUtterance.onend` now identity-check against ref-tracked current values so a cancelled handler can never reset state on top of a newer speak.
- [phase-22]: `handleUserTurn` increments `turnGenerationRef` and bails at the post-SSE-parse checkpoint when a newer turn arrives, so Web Speech multi-final firing parallel turns ends up with only the latest dispatching tools and speaking.
- [phase-23]: Voice output is 100% LLM-generated. Greet on open is no longer hardcoded — `handleUserTurn(trigger, { kind: 'greet' })` sends a synthetic kickoff to the LLM and speaks whatever it writes back. Empty-response and server-error fallbacks are silent (UI caption only). The trigger phrasing is a system instruction, not user-facing speech.
- [phase-23]: Phase-22 R-1 regression hotfix shipped. `setState('speaking')` emits a fallback default level of 0.75 when `_liveAudio` is false; this exceeds the 0.35 barge-in threshold and triggered self-barge-in that aborted every TTS fetch via Phase-22's AbortController. Fix: barge-in `useEffect` now also checks `window.VoiceBus._liveAudio === true`, so phantom default-level emissions no longer fire barge-in.
- [phase-23]: User-reported live-deploy regression ("speech isn't working") was the trigger for the R-1 fix; bundled into Phase 23 because it sits in the same file and shipping the LLM-greet without the R-1 fix would land a broken greet anyway.

### Pending Todos

- API-03 remains deferred: run `scripts/verify-amplify-apis.mjs` against a reachable Amplify/custom-domain production URL in a future milestone.

### Blockers/Concerns

- Live Amplify/custom-domain API smoke testing is deferred until `audienclature.com` or the actual Amplify URL is publicly reachable.
- None for Phase 20. Lint still reports pre-existing warnings in unrelated files.

## Session Continuity

Last session: Phase 23 (dynamic voice output + R-1 hotfix)
Stopped at: Phase 23 complete
Resume file: .planning/phases/23-dynamic-voice-output/23-VERIFICATION.md

**Next:** Live-verify on `https://portfolio-v4-test.fly.dev/` after `fly deploy --remote-only`, then run `/gsd-audit-milestone` to validate v4.1 against original intent before archiving, or `/gsd-complete-milestone` to archive v4.1 and start v4.2 for remaining Wave 2 P1 fixes (F-05 / F-06 / F-07 / F-08 / F-09 still in `21-AUDIT.md`).

**Completed Phase:** 23 (Dynamic Voice Output + R-1 Hotfix) — 1 plan — 2026-04-26T01:15:00.000Z
**Completed Phase:** 22 (Voice Audio Serialization) — 1 plan — 2026-04-26T00:50:00.000Z
**Completed Phase:** 21 (Voice Audit and Wave 1 Fixes) — 1 plan — 2026-04-26T00:25:00.000Z
**Completed Phase:** 20 (Verification and Regression Coverage) — 1 plan — 2026-04-26T04:03:00.000Z
**Completed Phase:** 19 (FSB-Inspired Control Overlay) — 1 plan — 2026-04-26T03:45:00.000Z
**Completed Phase:** 17 (Direct Inbuilt Project Browser) — 2 plans — 2026-04-26T03:25:00.000Z
