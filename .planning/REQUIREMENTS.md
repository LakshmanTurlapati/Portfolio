# Requirements: Portfolio V2 -- Milestone v4.2 Carry-forward Polish & Hardening

**Defined:** 2026-04-26
**Core Value:** A visually striking, interactive portfolio that showcases projects with rich detail, ambient animations, and an AI persona.
**Milestone Goal:** Close out v4.1's deferred items -- voice reliability hardening, mobile UX gaps, FSB overlay polish, and a chat UI redesign -- without regressing shipped behavior.

## v4.2 Requirements

Requirements scoped to v4.2. Each maps to a roadmap phase. All items are carry-forward from v4.1's deferred backlog.

### VOICE -- Voice Hardening (Wave 2 from `21-AUDIT.md`)

- [ ] **VOICE-05** (F-05): User's openTextChat call from voice does not race View Transitions across page changes. Replace hardcoded 400 ms `setTimeout` in `src/providers/voice-session-provider.tsx:82` with a VoiceBus `page-ready` event listener.
- [ ] **VOICE-06** (F-06): User does not get stuck in "listening" state if Scribe stalls before `SESSION_STARTED`. Add a 5 s guard timer at `src/lib/voice-controller.ts:693` that falls back to Web Speech if the event does not fire.
- [ ] **VOICE-07** (F-07): User does not silently lose voice playback on Safari when SpeechSynthesis drops. Add a text-length-aware worst-case timeout (~50 ms / char + 1 s floor) to the fallback path at `src/lib/voice-controller.ts:343` so `finishSynth()` resolves even when `onend` and `onerror` both miss.
- [ ] **VOICE-08** (F-08): Voice tool callbacks unregister cleanly across page navigation. Update `registerToolCallbacks` in `src/providers/voice-session-provider.tsx:43` to return a deregister function that removes its keys; consumers must call it on unmount.
- [ ] **VOICE-09** (F-09): A throwing tool callback does not abort the voice turn. Factor a `runTool()` helper in `src/lib/voice-controller.ts:125` that wraps every callback invocation with try/catch, emits `tool-executing` -> `tool-success` / `tool-error`, and lets the turn continue.

### MOB -- Mobile UX

- [ ] **MOB-01**: User experiences smooth particle background on mobile. Detect mobile in `src/components/particle-background.tsx:84`, reduce particle count from 90 to ~40-50, and optionally gate the breathing rAF loop.
- [ ] **MOB-02**: User can type into the chat input on iOS without keyboard / viewport jank. Add `inputMode`, focus-scroll, and review safe-area inset bottom on the input wrapper in `src/components/chat-popup.tsx:505`.
- [ ] **MOB-03**: User can read and interact with project-detail content on mobile without horizontal cramping. Add responsive padding (`px-4 lg:px-14`) and review stats grid + cover image margin in `src/components/project-detail.tsx`.

### FSB -- Overlay Polish

- [ ] **FSB-04**: User sees context-aware action captions in the FSB overlay during Parz tool actions. Subscribe to VoiceBus `tool-executing` events in `src/components/fsb-control-overlay.tsx`, track the current tool name, and render it (replacing or supplementing the static "powered by FSB" badge).
- [ ] **FSB-05**: User sees an FSB overlay sized appropriately for mobile. Add a mobile breakpoint to `src/components/fsb-control-overlay.tsx` -- hide the grid on small screens and tune the badge for mobile dimensions.

### CHAT-UI -- Chat Redesign

- [ ] **CHAT-UI-01**: User experiences a redesigned chat popup with refreshed visual / UX polish. Run a UI-SPEC phase first (design contract for `src/components/chat-popup.tsx`), then execute against that spec.

## Future Requirements

Not in v4.2 roadmap. Tracked for future milestones.

### API -- Live Verification

- **API-03**: Live Amplify / custom-domain smoke test of `/api/chat`, `/api/stt-token`, `/api/tts` against `audienclature.com` using `scripts/verify-amplify-apis.mjs`. Deferred until a reachable production URL exists.

## Out of Scope

Explicitly excluded for v4.2.

| Feature | Reason |
|---------|--------|
| Live Amplify / custom-domain API smoke (API-03) | Script ready (`scripts/verify-amplify-apis.mjs`); blocked on `audienclature.com` or actual Amplify URL becoming publicly reachable. Will be picked up in a future milestone once the deploy target is online. |
| New voice features beyond hardening | v4.2 is polish and bug fix only; no new tools, prompts, or persona changes. |
| Architectural rewrites | v4.2 is targeted carry-forward; major refactors live in their own milestones. |
| GitFly source / private InfiniteChoice / Voyza implementation details | Same v4.1 boundary -- public-only content. |
| Right-side ProjectDetail panel as primary project experience | Removed in v4.1 Phase 17; no return path planned. |

## Traceability

Filled by the roadmapper after phase mapping.

| Requirement | Phase | Status |
|-------------|-------|--------|
| VOICE-05 | Phase 25 (Voice Wave 2 Hardening) | Pending |
| VOICE-06 | Phase 25 (Voice Wave 2 Hardening) | Pending |
| VOICE-07 | Phase 25 (Voice Wave 2 Hardening) | Pending |
| VOICE-08 | Phase 25 (Voice Wave 2 Hardening) | Pending |
| VOICE-09 | Phase 25 (Voice Wave 2 Hardening) | Pending |
| MOB-01 | Phase 26 (Mobile UX Pass) | Pending |
| MOB-02 | Phase 26 (Mobile UX Pass) | Pending |
| MOB-03 | Phase 26 (Mobile UX Pass) | Pending |
| FSB-04 | Phase 27 (FSB Overlay Polish) | Pending |
| FSB-05 | Phase 27 (FSB Overlay Polish) | Pending |
| CHAT-UI-01 | Phase 28 (Chat UI Redesign) | Pending |

**Coverage:**
- v4.2 requirements: 11 total
- Mapped to phases: 11
- Unmapped: 0

**Phase mapping summary:**
- Phase 25: 5 requirements (VOICE-05..09)
- Phase 26: 3 requirements (MOB-01..03)
- Phase 27: 2 requirements (FSB-04, FSB-05)
- Phase 28: 1 requirement (CHAT-UI-01)

**Cross-phase dependency notes:**
- Phase 28 (CHAT-UI-01) hard-depends on Phase 26 (MOB-02): both edit `src/components/chat-popup.tsx`. MOB-02 lands the iOS keyboard / safe-area baseline before the redesign so the UI-SPEC can assume good mobile behavior and merge thrash is avoided.
- Phase 27 (FSB-04) soft-depends on Phase 25 (VOICE-09): the `runTool` wrapping in VOICE-09 emits clean `tool-executing` -> `tool-success` / `tool-error` events that FSB-04 subscribes to for caption tracking.
- Phase 25 and Phase 26 are independent and could run in parallel; sequenced 25 -> 26 to keep voice + UI work from interleaving.

---
*Requirements defined: 2026-04-26*
*Last updated: 2026-04-26 -- traceability filled after roadmap creation (4 phases, 11/11 mapped)*
