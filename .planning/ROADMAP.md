# Roadmap: Portfolio V2 — Next.js Migration

## Milestones

- [x] **v1.0 Migration** — Phases 1-4 (shipped, partial — see `milestones/v3-ROADMAP.md` for the merged carry-forward)
- [x] **v3 Portfolio Redesign** — Phases 5-11 (shipped 2026-04-24, see `milestones/v3-ROADMAP.md`)
- [x] **v4.0 Voice Mode Production** — Phases 12-15 (shipped 2026-04-26, see `milestones/v4.0-ROADMAP.md`)
- [x] **v4.1 Parz Persona, Portfolio Context, and Site Control Refresh** — Phases 16-24 (shipped 2026-04-26, see `milestones/v4.1-ROADMAP.md`)
- [ ] **v4.2 Carry-forward Polish & Hardening** — Phases 25-28 (active)

## Phases

<details>
<summary>v4.1 Parz Persona, Portfolio Context, and Site Control Refresh (Phases 16-24) — SHIPPED 2026-04-26</summary>

- [x] Phase 16: Public-Safe Persona and Content Refresh (3/3 plans) — completed 2026-04-26
- [x] Phase 17: Direct Inbuilt Project Browser (2/2 plans) — completed 2026-04-26
- [x] Phase 18: Global Parz Site Control (3/3 plans) — completed 2026-04-26
- [x] Phase 19: FSB-Inspired Control Overlay (1/1 plan) — completed 2026-04-26
- [x] Phase 20: Verification and Regression Coverage (1/1 plan) — completed 2026-04-26
- [x] Phase 21: Voice Audit and Wave 1 Fixes (1/1 plan) — completed 2026-04-26
- [x] Phase 22: Voice Audio Serialization (1/1 plan) — completed 2026-04-26
- [x] Phase 23: Dynamic Voice Output + R-1 Hotfix (1/1 plan) — completed 2026-04-26
- [x] Phase 24: Mobile Pass + Voice Stabilization (1/1 plan) — completed 2026-04-26

Full archive: [`milestones/v4.1-ROADMAP.md`](milestones/v4.1-ROADMAP.md)

</details>

<details>
<summary>v4.0 Voice Mode Production (Phases 12-15) — SHIPPED 2026-04-26</summary>

See [`milestones/v4.0-ROADMAP.md`](milestones/v4.0-ROADMAP.md) for full phase details.

</details>

<details>
<summary>v3 Portfolio Redesign (Phases 5-11) — SHIPPED 2026-04-24</summary>

See [`milestones/v3-ROADMAP.md`](milestones/v3-ROADMAP.md) for full phase details.

</details>

<details>
<summary>v1.0 Migration (Phases 1-4) — SHIPPED (partial; carried into v3)</summary>

See `milestones/v3-ROADMAP.md` (merged with v3 carry-forward).

</details>

### v4.2 Carry-forward Polish & Hardening (Active)

**Milestone Goal:** Close out v4.1's deferred items — voice reliability hardening, mobile UX gaps, FSB overlay polish, and a chat UI redesign — without regressing shipped behavior.

- [x] **Phase 25: Voice Wave 2 Hardening** — Close the five P1 audit findings (F-05..F-09) so voice survives slow networks, Safari quirks, page navigation, and throwing tool callbacks (completed 2026-04-26)
- [x] **Phase 26: Mobile UX Pass** — Smooth particles on mobile, sane iOS keyboard handling for chat input, readable project-detail layout on small screens (completed 2026-04-26)
- [ ] **Phase 27: FSB Overlay Polish** — Dynamic action captions in the overlay during Parz tool runs, plus a mobile-tuned overlay treatment
- [x] **Phase 28: Chat UI Redesign** — Run a UI-SPEC against `chat-popup.tsx`, then ship the visual / UX polish on top of the Phase 26 mobile baseline (completed 2026-04-26)

## Phase Details

### Phase 25: Voice Wave 2 Hardening
**Goal**: Voice mode no longer hangs, races, or aborts mid-turn under the five known P1 conditions from `21-AUDIT.md` Wave 2
**Depends on**: Phase 24 (last shipped — voice path stabilized for AudioContext + safe-area)
**Requirements**: VOICE-05, VOICE-06, VOICE-07, VOICE-08, VOICE-09
**Success Criteria** (what must be TRUE):
  1. User saying "switch to text chat" from `/portfolio` or `/about` lands in a focused, mounted chat popup every time — no empty popup from a 400 ms race against View Transitions (VOICE-05).
  2. User does not get stuck in "Listening…" forever when Scribe accepts the connection but stalls; within ~5 s the controller falls back to Web Speech and surfaces a caption (VOICE-06).
  3. User on Safari (or any browser where SpeechSynthesis silently no-ops) sees voice exit `speaking` state in worst-case proportional time, never permanently stuck (VOICE-07).
  4. User who navigates between pages does not accumulate stale voice tool callbacks; each page's callbacks are deregistered on unmount and dispatch only invokes live handlers (VOICE-08).
  5. User triggering a tool whose callback throws sees the voice turn continue with a `tool-error` glow instead of an aborted turn — every callback is wrapped (VOICE-09).
**Plans**: 5 plans
- [x] 25-01-PLAN.md — VOICE-09: Add runTool helper and refactor dispatchToolCall (Wave 1)
- [x] 25-02-PLAN.md — VOICE-08: registerToolCallbacks returns deregister fn (Wave 2)
- [x] 25-03-PLAN.md — VOICE-05: page-ready event in transition-provider + openTextChat listener (Wave 3)
- [x] 25-04-PLAN.md — VOICE-06: 5s Scribe SESSION_STARTED guard with fallback (Wave 2)
- [x] 25-05-PLAN.md — VOICE-07: SpeechSynthesis worst-case timeout (Wave 3)

### Phase 26: Mobile UX Pass
**Goal**: User experiences smooth animations, sane keyboard handling, and uncramped layouts across the three known mobile pain points
**Depends on**: Phase 25 (no hard code dependency, but ordering avoids interleaving voice + UI work)
**Requirements**: MOB-01, MOB-02, MOB-03
**Success Criteria** (what must be TRUE):
  1. User on a mobile device sees the particle background render smoothly with reduced particle count (~40-50 vs desktop's 90) and no visible jank from the breathing rAF loop (MOB-01).
  2. User typing into the chat input on iOS sees the field scroll into view above the keyboard, with `inputMode` hinting the right keyboard and safe-area insets respected on the input wrapper (MOB-02).
  3. User reading a project detail on mobile sees responsive horizontal padding (`px-4` on small screens, `px-14` from `lg` up), with stats grid and cover image margins that don't crop or cramp content (MOB-03).
**Plans**: 3 plans
- [x] 26-01-PLAN.md — MOB-01: Mobile particle count reduction (45 vs 90 via useMediaQuery 768px breakpoint)
- [x] 26-02-PLAN.md — MOB-02: iOS chat keyboard handling (inputMode/enterKeyHint/autoComplete + 300ms scrollIntoView focus + bottom safe-area inset)
- [x] 26-03-PLAN.md — MOB-03: Project-detail responsive layout (px-4 md:px-8 lg:px-14 padding ladder + full-bleed mobile cover + 2-col stats grid + proportional type scale)
**UI hint**: yes

### Phase 27: FSB Overlay Polish
**Goal**: User can see what Parz is actually doing through dynamic action captions, and the overlay feels right-sized on mobile
**Depends on**: Phase 25 (consumes VOICE-09's clean `tool-executing` emission semantics for caption tracking)
**Requirements**: FSB-04, FSB-05
**Success Criteria** (what must be TRUE):
  1. User watching Parz perform a tool action (open project, navigate, scroll, close browser, toggle theme, open link) sees a context-aware action caption rendered in the FSB overlay, sourced from VoiceBus `tool-executing` events (FSB-04).
  2. User on mobile sees an overlay treatment scaled for small screens — the desktop grid is hidden, badge dimensions tuned for mobile, and pointer-safety preserved (FSB-05).
  3. User on desktop sees the overlay continue to behave exactly as it did at end of Phase 19 / 23 — no regression on monochrome styling, badge copy `powered by FSB`, or pointer-safety (FSB-04, FSB-05).
**Plans**: 3 plans
- [ ] 27-01-PLAN.md — FSB-04: Extend runTool helper to emit { name, args } payload (Wave 1)
- [ ] 27-02-PLAN.md — FSB-04: Caption state machine + per-tool resolver in fsb-control-overlay.tsx + overlay lifetime reconciliation (Wave 2)
- [ ] 27-03-PLAN.md — FSB-05: Mobile breakpoint gate for grid + WCAG 2.5.5 badge sizing + 600/768px breakpoint reconciliation (Wave 3)
**UI hint**: yes

### Phase 28: Chat UI Redesign
**Goal**: User experiences a refreshed visual / UX polish of the chat popup that reflects current portfolio aesthetic, executed against an explicit UI spec
**Depends on**: Phase 26 (Phase 28 redesigns `src/components/chat-popup.tsx`; MOB-02's iOS keyboard fix on the same file must land first to avoid merge thrash and so the redesign inherits a clean mobile baseline)
**Requirements**: CHAT-UI-01
**Success Criteria** (what must be TRUE):
  1. User can read and review a UI-SPEC document for the redesigned chat popup before any code lands — covering visual language, layout, motion, and accessibility decisions.
  2. User on desktop opens the chat popup and sees the redesigned visual treatment, matching the UI-SPEC pixel-for-pixel.
  3. User on mobile opens the chat popup and sees the redesign respect MOB-02's keyboard / safe-area behavior — no regression in iOS input handling.
  4. User sending and receiving messages, hitting suggestion chips, and seeing loading / error states experiences the same functional behavior as the v4.1 popup — redesign is visual / UX polish, not a behavior change.
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 25 → 26 → 27 → 28

| Phase | Milestone | Plans Complete | Status      | Completed  |
|-------|-----------|----------------|-------------|------------|
| 16. Public-Safe Persona and Content Refresh | v4.1 | 3/3 | Complete    | 2026-04-26 |
| 17. Direct Inbuilt Project Browser          | v4.1 | 2/2 | Complete    | 2026-04-26 |
| 18. Global Parz Site Control                | v4.1 | 3/3 | Complete    | 2026-04-26 |
| 19. FSB-Inspired Control Overlay            | v4.1 | 1/1 | Complete    | 2026-04-26 |
| 20. Verification and Regression Coverage    | v4.1 | 1/1 | Complete    | 2026-04-26 |
| 21. Voice Audit and Wave 1 Fixes            | v4.1 | 1/1 | Complete    | 2026-04-26 |
| 22. Voice Audio Serialization               | v4.1 | 1/1 | Complete    | 2026-04-26 |
| 23. Dynamic Voice Output + R-1 Hotfix       | v4.1 | 1/1 | Complete    | 2026-04-26 |
| 24. Mobile Pass + Voice Stabilization       | v4.1 | 1/1 | Complete    | 2026-04-26 |
| 25. Voice Wave 2 Hardening                  | v4.2 | 5/5 | Complete    | 2026-04-26 |
| 26. Mobile UX Pass                          | v4.2 | 3/3 | Complete    | 2026-04-26 |
| 27. FSB Overlay Polish                      | v4.2 | 0/3 | Planned     | -          |
| 28. Chat UI Redesign                        | v4.2 | 0/TBD | Not started | -          |
