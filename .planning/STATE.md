---
gsd_state_version: 1.0
milestone: v4.3
milestone_name: Legacy V2 Chat-Only Boundary
status: complete
stopped_at: Completed 29-01-PLAN.md
last_updated: "2026-04-29T20:48:36.902Z"
last_activity: 2026-04-29 -- Phase 29 plan complete
progress:
  total_phases: 1
  completed_phases: 1
  total_plans: 1
  completed_plans: 1
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-29)

**Core value:** A visually striking, interactive portfolio that showcases projects with rich detail, ambient animations, and an AI persona.
**Current focus:** v4.3 Legacy V2 Chat-Only Boundary.

## Current Position

Phase: 29 — Legacy V2 Chat-Only Boundary
Plan: 01 — Voice-only site-control boundary
Status: Complete
Last activity: 2026-04-29 -- Phase 29 plan complete

```
v4.3 Progress: [██████████] 100% (1/1 phases complete, 1/1 plans complete)
```

## Performance Metrics

**Velocity:**

- Total plans completed: 28 across v4.1 (phases 16-24)
- Average duration: tracked during execution
- Total execution time: tracked during execution

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 16-24 (v4.1) | 14 | -- | -- |
| 25-28 (v4.2) | 14 | -- | -- |
| 25 | 5 | -- | -- |
| 26 | 3 | -- | -- |
| 27 | 3 | -- | -- |
| 28 | 3 | -- | -- |
| Phase 29-legacy-v2-chat-only-boundary P01 | 4 min | 3 tasks | 5 files |

## Accumulated Context

### Decisions

- [v4.2-roadmap]: Continue numbering from v4.1; v4.2 starts at Phase 25 and ends at Phase 28.
- [v4.2-roadmap]: Coarse granularity compresses 11 requirements into 4 phases: voice hardening, mobile UX, overlay polish, chat redesign.
- [v4.2-roadmap]: Phase 28 (chat redesign) hard-depends on Phase 26 (mobile UX) because both edit `src/components/chat-popup.tsx`; MOB-02 lands the iOS keyboard baseline first, then redesign on top.
- [v4.2-roadmap]: Phase 27 (FSB overlay) soft-depends on Phase 25's VOICE-09 (`runTool` wrapping) so caption tracking subscribes to clean `tool-executing` semantics.
- [v4.2-roadmap]: Phase 28 includes an in-phase UI-SPEC step before code (CHAT-UI-01 is design-driven).
- [v4.2-roadmap]: API-03 stays deferred and out of v4.2 scope; tracked under Future Requirements until a reachable Amplify/custom-domain URL exists.
- [post-v4.2-chat-design]: The DART-refined chat popup is the final visual design baseline. Current code is near-final visually; remaining work is transition/animation polish only.
- [post-v4.2-chat-design]: Track remaining popup motion work as CHAT-ANIM-01, a future requirement that must not reopen the visual design decision.
- [post-v4.2-overlay]: Project/right overlay work targets `IframeViewer`'s preview-control overlay (`fsb-preview-control-overlay`), not the obsolete right-side ProjectDetail panel. The global `FsbControlOverlay` remains the Parz action-caption surface.
- [v4.3-scope]: Legacy V2 text chat is conversation-only. Navigation, project opening, shell scrolling, theme toggling, tours, browser control, and other tool-driven site control belong to voice mode.
- [Phase 29-legacy-v2-chat-only-boundary]: Text chat site-control tools are now server-authoritatively gated on isVoice: true; stale enableSiteControl input is accepted only as ignored legacy input.
- [Phase 29-legacy-v2-chat-only-boundary]: Legacy V2 popup and /chat use default useChat transport and contain no client-side SiteControl/tool dispatch path.

### v4.2 Carry-forward Investigation (file:line evidence, verified 2026-04-26 against `e2a1383`)

- [v4.2-F-05]: `src/providers/voice-session-provider.tsx:82` -- hardcoded 400ms setTimeout still races View Transitions (~500ms). Phase 25 / VOICE-05. Complexity: S.
- [v4.2-F-06]: `src/lib/voice-controller.ts:693` -- no timeout guard if Scribe stalls before `SESSION_STARTED`. Phase 25 / VOICE-06. Complexity: M.
- [v4.2-F-07]: `src/lib/voice-controller.ts:343` -- SpeechSynthesis fallback has no worst-case timeout. Phase 25 / VOICE-07. Complexity: M.
- [v4.2-F-08]: `src/providers/voice-session-provider.tsx:43` -- `registerToolCallbacks` accumulates stale handlers. Phase 25 / VOICE-08. Complexity: S.
- [v4.2-F-09]: `src/lib/voice-controller.ts:125` -- tool callback throws abort the voice turn. Phase 25 / VOICE-09. Complexity: S.
- [v4.2-particles]: `src/components/particle-background.tsx:84` -- 90 particles hardcoded, no mobile gate. Phase 26 / MOB-01. Complexity: S.
- [v4.2-chat-ios]: `src/components/chat-popup.tsx:505` -- input has no `inputMode`, no focus-scroll. Phase 26 / MOB-02. Complexity: S.
- [v4.2-project-detail-mobile]: `src/components/project-detail.tsx` -- `px-14` cramps mobile. Phase 26 / MOB-03. Complexity: M. Historical finding; resolved by accepting `IframeViewer` as canonical project viewer and deleting the orphaned ProjectDetail path.
- [v4.2-FSB-04]: `src/components/fsb-control-overlay.tsx:29` -- only static badge; needs `tool-executing` subscription. Phase 27 / FSB-04. Complexity: M.
- [v4.2-FSB-05]: `src/components/fsb-control-overlay.tsx` -- no mobile breakpoint. Phase 27 / FSB-05. Complexity: S.
- [v4.2-CHAT-UI-01]: `src/components/chat-popup.tsx` -- design-driven visual / UX polish. Phase 28. Complexity: L (UI-SPEC required).
- [v4.2-API-03]: `scripts/verify-amplify-apis.mjs` -- ready; blocked on reachable Amplify URL. Out of v4.2 scope.

### Pending Todos

- Address deferred persona current-work parity issue recorded in `.planning/phases/29-legacy-v2-chat-only-boundary/deferred-items.md`.
- API-03 remains future work and gated on a reachable Amplify/custom-domain production URL.
- CHAT-ANIM-01 remains future work: refine DART chat popup transitions and animations without changing the final visual design baseline.
- Manual browser/device UAT from v4.2 is retained as post-milestone QA in per-phase `HUMAN-UAT.md` files, not as a milestone blocker.

### Blockers/Concerns

- No Phase 29 chat-boundary blockers remain.
- Combined plan Vitest still has an out-of-scope persona parity failure in `tests/parz-contracts.test.ts`; boundary-specific `tests/voice-barge-in.test.ts` passes.
- Live Amplify/custom-domain API smoke testing is future work until `audienclature.com` or the actual Amplify URL becomes publicly reachable.

## Session Continuity

Last session: 2026-04-29T20:48:36.899Z
Stopped at: Completed 29-01-PLAN.md
Resume file: None

**Next:** Phase 29 complete; ready for verify-work or milestone completion.

**Completed Milestone:** v4.2 Carry-forward Polish & Hardening -- 4 phases, 14 plans -- 2026-04-27
**Completed Phase:** 28 (Chat UI Redesign) -- 3 plans -- 2026-04-27
**Completed Phase:** 27 (FSB Overlay Polish) -- 3 plans -- 2026-04-27
**Completed Phase:** 26 (Mobile UX Pass) -- 3 plans -- 2026-04-26
**Completed Phase:** 25 (Voice Wave 2 Hardening) -- 5 plans -- 2026-04-26
**Completed Milestone:** v4.1 Parz Persona, Portfolio Context, and Site Control Refresh -- 9 phases, 14 plans -- 2026-04-26
**Completed Phase:** 24 (Mobile Pass + Voice Stabilization) -- 1 plan -- 2026-04-26T07:10:00.000Z
**Completed Phase:** 23 (Dynamic Voice Output + R-1 Hotfix) -- 1 plan -- 2026-04-26T01:15:00.000Z
**Completed Phase:** 22 (Voice Audio Serialization) -- 1 plan -- 2026-04-26T00:50:00.000Z
**Completed Phase:** 21 (Voice Audit and Wave 1 Fixes) -- 1 plan -- 2026-04-26T00:25:00.000Z
**Completed Phase:** 20 (Verification and Regression Coverage) -- 1 plan -- 2026-04-26T04:03:00.000Z
**Completed Phase:** 19 (FSB-Inspired Control Overlay) -- 1 plan -- 2026-04-26T03:45:00.000Z
**Completed Phase:** 17 (Direct Inbuilt Project Browser) -- 2 plans -- 2026-04-26T03:25:00.000Z
