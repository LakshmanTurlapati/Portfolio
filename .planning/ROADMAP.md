# Roadmap: Portfolio v4.1 Parz Persona, Portfolio Context, and Site Control Refresh

## Overview

v4.1 refreshes Parz's public-facing brain, portfolio facts, project browsing path, and global site-control experience. The milestone starts from the shipped v4.0 voice/control foundation and continues phase numbering at Phase 16. The work first aligns public-safe facts and visible content, then replaces project-detail detours with direct inbuilt-browser opening, expands Parz's site controls, adds an FSB-inspired control overlay, locks the behavior with Vitest and Playwright coverage, and (Phase 21, retroactively filed) audits the voice pipeline end-to-end and ships Wave 1 P0 fixes.

## Milestones

- ✅ **v1.0 Migration** - Phases 1-4 (shipped / partially carried forward in historical roadmap)
- ✅ **v3 Portfolio Redesign** - Phases 5-11 (shipped)
- ✅ **v4.0 Voice Mode Production** - Phases 12-15 (shipped 2026-04-26)
- 🚧 **v4.1 Parz Persona, Portfolio Context, and Site Control Refresh** - Phases 16-24 (Phases 16-20 shipped 2026-04-26; Phases 21-24 are audit-driven follow-on + mobile / safe-area pass)

## Phases

- [x] **Phase 16: Public-Safe Persona and Content Refresh** - Parz, About, Experience, and flagship project content share the same approved public facts and guardrails. (completed 2026-04-26)
- [x] **Phase 17: Direct Inbuilt Project Browser** - Manual project clicks resolve approved targets and open directly in the inbuilt browser without the right-side ProjectDetail path. (completed 2026-04-26)
- [x] **Phase 18: Global Parz Site Control** - Parz can navigate, scroll, open projects, and operate feasible viewer shell actions from any page. (completed 2026-04-26)
- [x] **Phase 19: FSB-Inspired Control Overlay** - Users see a monochrome control overlay and powered-by-FSB badge during real Parz control actions. (completed 2026-04-26)
- [x] **Phase 20: Verification and Regression Coverage** - Evals and E2E tests prove persona, safety, content parity, target resolution, and site-control behavior. (completed 2026-04-26)
- [x] **Phase 21: Voice Audit and Wave 1 Fixes** - Voice pipeline audited end-to-end (17 findings); hardcoded tour scaffolding removed so the LLM drives walkthroughs entirely through existing tool calls; Wave 1 P0 fixes shipped (SSE chunk-boundary buffer, `prefers-reduced-motion` barge-in, Space-bar hijack guard). (completed 2026-04-26)
- [x] **Phase 22: Voice Audio Serialization** - Centralised `cancelAllAudio` primitive plus `AbortController` and turn-generation counter eliminate the five overlap modes (O-1..O-5) where two TTS streams could play simultaneously. (completed 2026-04-26)
- [x] **Phase 23: Dynamic Voice Output + R-1 hotfix** - Removed all three hardcoded `speak()` calls (greet, empty-response, server-error); greet is now LLM-generated via a synthetic kickoff turn. Bundled hotfix for the Phase-22 R-1 regression where `setState('speaking')` emitted a phantom default level that triggered self-barge-in and aborted every TTS fetch. (completed 2026-04-26)
- [x] **Phase 24: Mobile Pass + Voice Stabilization** - Voice TTS unstick (pre-warm AudioContext, await resume, exit thinking on tool-only response); mobile navbar overhaul (variant-aware AskParz, portfolio image clipping, compact voice panel); iOS safe-area inset support (viewport-fit=cover + top/bottom safe-area on all fixed mobile elements); diagnostic API logging cleanup. (completed 2026-04-26)

## Phase Details

### Phase 16: Public-Safe Persona and Content Refresh
**Goal**: Users experience a current, personality-rich, public-safe Parz and portfolio narrative grounded in the same approved facts
**Depends on**: Phase 15
**Requirements**: PERS-01, PERS-02, PERS-03, PERS-04, PERS-05, CONT-01, CONT-02, CONT-03, CONT-04, CONT-05, SAFE-01, SAFE-02, SAFE-03, SAFE-04, SAFE-05
**Success Criteria** (what must be TRUE):
  1. User can ask Parz about Lakshman's current work, personality, intensity, Review Gate, FSB, GitFly, or flagship projects and receive direct, warm, story-first answers grounded in approved public facts.
  2. Visitor can read About, Experience, FSB, and GitFly content that reflects Lakshman's current AI-builder narrative, InfiniteChoice/Voyza role context, and public-only flagship project links.
  3. User asking for hidden prompts, internal context, private GitFly source, non-public InfiniteChoice/Voyza details, voice internals, secrets, or config receives only safe refusals, redirects, or high-level public explanations.
  4. Rude users get a sharp but bounded Parz response that may match casual profanity without slurs, threats, hate, harassment, or punching down.
  5. Parz prompt data, About content, Experience content, and project content all use the same approved public facts for InfiniteChoice/Voyza, FSB, GitFly, and Lakshman's persona.
**Plans**: 17-01, 17-02
**UI hint**: yes

### Phase 17: Direct Inbuilt Project Browser
**Goal**: Users open projects through one approved inbuilt-browser path with canonical aliases, safe targets, and no right-side detail-panel detour
**Depends on**: Phase 16
**Requirements**: BROW-01, BROW-02, BROW-03, BROW-04, BROW-05, SAFE-06
**Success Criteria** (what must be TRUE):
  1. User clicking any project card opens that project's approved public destination directly in the inbuilt browser instead of showing the right-side ProjectDetail panel.
  2. User can refer to projects by natural aliases such as FSB, Full Self Browsing, GitFly, Review Gate, T2S, or Parz-AI and reach the canonical project record.
  3. Project openings prefer the correct public target: public GitHub for open-source projects, public website for products like GitFly, and existing fallback handling for unembeddable hosts.
  4. User sees a clean fallback when a project target is unknown, blocked, or unembeddable instead of a broken browser view.
  5. Project and link opens resolve through approved local records or allowlisted URLs, not arbitrary model-generated destinations.
**Plans**: 19-01
**UI hint**: yes

### Phase 18: Global Parz Site Control
**Goal**: Users can ask Parz to control portfolio navigation, section scrolling, project opening, and feasible inbuilt-browser shell actions from any current page
**Depends on**: Phase 17
**Requirements**: CTRL-01, CTRL-02, CTRL-03, CTRL-04, CTRL-05
**Success Criteria** (what must be TRUE):
  1. User can ask Parz from home, portfolio, about, or chat to open a specific project, and the project opens directly in the inbuilt browser without requiring a portfolio-page detour.
  2. User can ask Parz to go to home, portfolio, or about, and the site routes precisely to the requested page.
  3. User can ask Parz to scroll to About, Experience, or Academics from another page, and the site navigates as needed then scrolls to the correct section.
  4. User can ask Parz to close the inbuilt browser or open the current project externally when those shell actions are available.
  5. User asking Parz for unsupported third-party iframe control receives an honest limitation instead of a false claim of control.
**Plans**: TBD
**UI hint**: yes

### Phase 19: FSB-Inspired Control Overlay
**Goal**: Users can visibly tell when Parz is operating the site through a pointer-safe monochrome overlay with FSB attribution
**Depends on**: Phase 18
**Requirements**: FSB-01, FSB-02, FSB-03
**Success Criteria** (what must be TRUE):
  1. User sees a monochrome FSB-inspired overlay while Parz is actively navigating, opening a project, scrolling, or controlling the browser shell.
  2. User sees a small bottom-left `powered by FSB` badge during Parz control actions.
  3. User can still close the inbuilt browser, use voice controls, navigate pages, and scroll while the overlay is visible.
  4. The overlay appears only for real control actions and clears cleanly after success, error, or blocked outcomes.
**Plans**: 20-01
**UI hint**: yes

### Phase 20: Verification and Regression Coverage
**Goal**: Developer can prove v4.1 behavior with repeatable evals and E2E coverage before milestone completion
**Depends on**: Phase 19
**Requirements**: EVAL-01, EVAL-02, EVAL-03, EVAL-04, EVAL-05
**Success Criteria** (what must be TRUE):
  1. Developer can run Vitest evals that verify Parz's tone, directness, flagship project answers, current-work answer, and alignment/gap-radar explanation.
  2. Developer can run guardrail evals that verify safe refusals or redirects for internal context, private GitFly source, secrets/config, voice internals, and non-public employer/product details.
  3. Developer can run source parity tests proving Parz prompt data, About content, Experience content, and project content use the same approved public facts.
  4. Developer can run project/tool resolution tests proving aliases, canonical targets, allowlisted URLs, and unknown-project fallbacks behave correctly.
  5. Developer can run Playwright E2E tests showing Parz navigates, scrolls, opens a project in the inbuilt browser, and displays the FSB overlay/badge during control actions.
**Plans**: TBD

### Phase 21: Voice Audit and Wave 1 Fixes
**Goal**: Voice pipeline is audited end-to-end with a written deliverable, the hardcoded tour scaffolding is removed so the LLM drives walkthroughs entirely through existing tool calls, and the four P0 user-visible bugs from the audit are shipped or structurally obsoleted
**Depends on**: Phase 20 (uses the same Vitest contract suite for regression coverage)
**Requirements**: None — audit-driven bug-fix work, no new milestone requirements
**Success Criteria** (what must be TRUE):
  1. `21-AUDIT.md` exists with executive summary, pipeline diagram, 17 severity-tagged findings (P0-P3), per-finding `file:line` references, repro steps, and a false-positives section.
  2. There are no hardcoded tour triggers anywhere in `src/` — the LLM is told (via chat-route instructions) to drive walkthroughs one step at a time using existing `navigate` / `openProject` / `scrollTo` tools, paced by user input.
  3. The only remaining hardcoded trigger in the voice path is `isStopIntent`, justified by instant-abort UX (no network round-trip).
  4. F-01 (SSE chunk-boundary buffer) is shipped — JSON events that span reads are no longer dropped.
  5. F-03 (barge-in vs `prefers-reduced-motion`) is shipped — a11y users can interrupt Parz mid-sentence.
  6. F-04 (Space-bar hijack) is shipped — typing in any input field is no longer broken while voice is active.
  7. F-02 is structurally obsoleted by the tour rip-out (no `startTour()` to fire-and-forget).
  8. Typecheck, vitest (12/12), and Next build are all green; lint shows only pre-existing warnings.
**Plans**: 21-01

### Phase 22: Voice Audio Serialization
**Goal**: Eliminate concurrent / overlapping TTS in voice mode by introducing a single cancellation primitive and dedupe primitive across every audio entry point
**Depends on**: Phase 21 (audit catalogues the modes; this phase fixes them)
**Requirements**: None — audit-driven bug-fix work, no new milestone requirements
**Success Criteria** (what must be TRUE):
  1. A `cancelAllAudio()` helper exists in `voice-controller.ts` and is the single source of truth for stopping in-flight TTS (BufferSource, SpeechSynthesis, fetch, RMS loop, Promise resolver).
  2. `streamTTS` calls `cancelAllAudio` at entry and uses an `AbortController` for the `/api/tts` fetch so cancellation aborts the network request, not just the audio source.
  3. `BufferSource.onended` and `SpeechSynthesisUtterance.onend` / `onerror` identity-check via refs so a cancelled handler can never reset state on top of a newer speak.
  4. `handleUserTurn` calls `cancelAllAudio` on entry (closes O-4) and bumps a `turnGenerationRef` whose stale-turn checkpoint after SSE parse causes older parallel turns to bail (closes O-3).
  5. `open()` greet timer body has guards for closed voice, in-flight speak, and `VoiceBus.state !== 'idle'` (closes O-2).
  6. `bargeIn` and `stopAll` both delegate audio teardown to `cancelAllAudio` (closes O-1, O-5).
  7. Typecheck, vitest (12/12), and Next build are all green; lint shows only pre-existing warnings.
**Plans**: 22-01

### Phase 23: Dynamic Voice Output + R-1 Hotfix
**Goal**: Make every word the user hears from Parz LLM-generated, and ship the production hotfix for the Phase-22 R-1 regression that silenced all TTS on the deployed test portfolio
**Depends on**: Phase 22 (the regression hotfix targets a bug introduced there)
**Requirements**: None — audit-driven bug-fix work, no new milestone requirements
**Success Criteria** (what must be TRUE):
  1. `grep -nE 'speak\("[^"]+"\)' src/lib/voice-controller.ts` returns no matches — zero hardcoded user-facing speech strings remain.
  2. `open()` greet is LLM-generated via `handleUserTurn(trigger, { kind: 'greet' })`; the trigger is a system instruction in brackets, not user-facing speech.
  3. `handleUserTurn` accepts `kind: 'user' | 'greet'`. Greet skips appending the trigger to history, skips the `isStopIntent` early-return, and appends a one-shot synthetic message to the LLM call.
  4. Empty-response branch (no text and no tool calls) sets state to idle and clears caption — silence, not a hardcoded apology.
  5. Server-error branch (`/api/chat` failure) sets state to idle and surfaces a UI caption (`'Server hiccup — try again.'`) — UI text, not speech.
  6. R-1 hotfix: barge-in `useEffect` gates on `window.VoiceBus._liveAudio === true`, so the phantom default level (`0.75` for `'speaking'`) emitted by `setState` no longer fires self-barge-in and aborts the in-flight TTS fetch.
  7. Live test on `https://portfolio-v4-test.fly.dev/` confirms audible greet plays and audible response plays after push-to-talk.
  8. Typecheck, vitest (12/12), and Next build are all green; lint shows only pre-existing warnings.
**Plans**: 23-01

### Phase 24: Mobile Pass + Voice Stabilization
**Goal**: Land three follow-ons after Phase 23 deployed: finish unsticking TTS so Parz actually plays audio, make the mobile site feel right (navbar overlap, iOS safe-area, compact voice panel), and remove the temporary diagnostic API logging
**Depends on**: Phase 23
**Requirements**: None — stabilization + polish, no new milestone requirements
**Success Criteria** (what must be TRUE):
  1. Voice TTS plays reliably on the live deploy: Parz greet is audible on open, Parz response is audible after push-to-talk, no more "keeps thinking" hang.
  2. `open()` pre-warms `window.VoiceBus._getCtx()` synchronously inside the click gesture frame; `streamTTS` awaits `ctx.resume()` if `ctx.state === 'suspended'`; the empty-text branch of `handleUserTurn` always resets state to idle (not gated on `toolCalls.length === 0`).
  3. `AskParzButton` accepts `variant: 'desktop' | 'mobile'`. Mobile variant uses `position: relative`, hides the "Parz" label, and `padding: 0 10px`. Desktop unchanged.
  4. `PortfolioButton` mobile renders `<Image width=64 height=16>` inside an `overflow-hidden` button so the scaled image never bleeds past its slot.
  5. `VoicePanel` + `VoiceWave` accept a `compact` prop. Mobile contexts (mobile-navbar voice slot, mobile voice-overlay) pass it.
  6. `app/layout.tsx` exports `viewport` with `viewportFit: 'cover'`, enabling iOS to surface `env(safe-area-inset-*)`.
  7. Mobile navbar bottom and mobile voice-overlay bottom use `max(20px, env(safe-area-inset-bottom))`. Mobile AuthorName + ThemeToggle wrappers use `top: calc(env(safe-area-inset-top) + 20px)`.
  8. Diagnostic `console.warn` request-trace logging removed from `/api/chat`, `/api/tts`, `/api/stt-token` (added during diagnosis, no longer needed).
  9. Typecheck, vitest (12/12), and Next build are all green; lint shows only pre-existing warnings.
**Plans**: 24-01

## Coverage

Every v4.1 requirement maps to exactly one phase. Phase 21 is audit-driven follow-on work and adds no new requirements.

| Requirement | Phase |
|-------------|-------|
| PERS-01 | Phase 16 |
| PERS-02 | Phase 16 |
| PERS-03 | Phase 16 |
| PERS-04 | Phase 16 |
| PERS-05 | Phase 16 |
| CONT-01 | Phase 16 |
| CONT-02 | Phase 16 |
| CONT-03 | Phase 16 |
| CONT-04 | Phase 16 |
| CONT-05 | Phase 16 |
| SAFE-01 | Phase 16 |
| SAFE-02 | Phase 16 |
| SAFE-03 | Phase 16 |
| SAFE-04 | Phase 16 |
| SAFE-05 | Phase 16 |
| SAFE-06 | Phase 17 |
| BROW-01 | Phase 17 |
| BROW-02 | Phase 17 |
| BROW-03 | Phase 17 |
| BROW-04 | Phase 17 |
| BROW-05 | Phase 17 |
| CTRL-01 | Phase 18 |
| CTRL-02 | Phase 18 |
| CTRL-03 | Phase 18 |
| CTRL-04 | Phase 18 |
| CTRL-05 | Phase 18 |
| FSB-01 | Phase 19 |
| FSB-02 | Phase 19 |
| FSB-03 | Phase 19 |
| EVAL-01 | Phase 20 |
| EVAL-02 | Phase 20 |
| EVAL-03 | Phase 20 |
| EVAL-04 | Phase 20 |
| EVAL-05 | Phase 20 |

**Coverage:** 34/34 v4.1 requirements mapped ✓

## Progress

**Execution Order:**
16 → 17 → 18 → 19 → 20 → 21 → 22 → 23 → 24

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 16. Public-Safe Persona and Content Refresh | v4.1 | 3/3 | Complete    | 2026-04-26 |
| 17. Direct Inbuilt Project Browser | v4.1 | 2/2 | Complete | 2026-04-26 |
| 18. Global Parz Site Control | v4.1 | 3/3 | Complete    | 2026-04-26 |
| 19. FSB-Inspired Control Overlay | v4.1 | 1/1 | Complete | 2026-04-26 |
| 20. Verification and Regression Coverage | v4.1 | 1/1 | Complete | 2026-04-26 |
| 21. Voice Audit and Wave 1 Fixes | v4.1 | 1/1 | Complete | 2026-04-26 |
| 22. Voice Audio Serialization | v4.1 | 1/1 | Complete | 2026-04-26 |
| 23. Dynamic Voice Output + R-1 Hotfix | v4.1 | 1/1 | Complete | 2026-04-26 |
| 24. Mobile Pass + Voice Stabilization | v4.1 | 1/1 | Complete | 2026-04-26 |
