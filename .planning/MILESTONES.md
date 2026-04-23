# Milestones

## v4.2 Carry-forward Polish & Hardening (Shipped: 2026-04-27)

**Phases completed:** 4 phases (25-28), 14 plans

**Key accomplishments:**

- Voice Wave 2 hardening closed the five carry-forward reliability issues from `21-AUDIT.md`: page-ready voice-to-text handoff, Scribe session-start guard, SpeechSynthesis worst-case timeout, deregister contract, and tool-callback exception wrapping.
- Mobile UX pass reduced particle load on mobile, preserved iOS chat keyboard behavior through the redesign, and confirmed IframeViewer as the canonical mobile project viewer after deleting the orphaned ProjectDetail path.
- FSB overlay now renders dynamic action captions from real tool payloads and hides the desktop scan grid on mobile while preserving pointer safety; project/right overlay assumptions now point to IframeViewer's preview-control overlay, not ProjectDetail.
- Chat popup redesign shipped with the DART-refined popup as the final visual baseline: refreshed surface/layout, typography, bubbles, suggestion chips, input/send controls, reduced-motion behavior, and accessibility roles.
- Live GitHub stats and the home-page matrix now pull GitHub profile contribution data through `/api/github-stats` on Fly.
- Milestone audit passed: 11/11 requirements satisfied at code level, 0 broken integration flows.

**Deferred:**

- Manual browser/device/screen-reader UAT is retained as post-milestone QA in per-phase `HUMAN-UAT.md` files.
- CHAT-ANIM-01: transition and animation refinements for the DART chat popup remain future polish and must preserve the final visual baseline.
- API-03 custom-domain / Amplify smoke testing remains future work until a reachable custom-domain production URL is available.

---

## v4.1 Parz Persona, Portfolio Context, and Site Control Refresh (Shipped: 2026-04-26)

**Phases completed:** 9 phases (16-24), 14 plans

**Key accomplishments:**

- Parz now grounds answers in a typed `public-profile` source of truth — current work as AI Enablement Engineer at InfiniteChoice building Voyza, persona traits, alignment/gap-radar story, flagship FSB and GitFly framing.
- Visible content (About, Experience, Projects) shares the same approved public facts as the system prompt, locked by Phase 20 source-parity tests.
- Project openings resolve through one approved inbuilt-browser path with canonical aliases and allowlisted targets — no more right-side ProjectDetail detour.
- Parz can navigate, scroll about-page sections, open projects, close the inbuilt browser, open the current project externally, and honestly refuse third-party iframe control — all from any current page.
- Pointer-safe monochrome FSB-inspired control overlay with `powered by FSB` badge appears around real Parz control actions.
- Deterministic local Vitest contract suite (12 tests) + a focused Playwright E2E spec covering persona, guardrails, source parity, project resolution, and shell control behaviour.
- Voice pipeline audited end-to-end (`21-AUDIT.md`, 17 findings). Wave 1 P0 fixes shipped (SSE chunk-boundary, prefers-reduced-motion barge-in, Space-bar hijack); hardcoded tour scaffolding ripped out so the LLM drives walkthroughs entirely through existing tools.
- Voice audio serialization rebuilt around a centralised `cancelAllAudio()` primitive plus AbortController plus turn-generation counter — closed five overlap modes (`22-AUDIT.md`, O-1..O-5).
- Voice output is 100% LLM-generated. All three hardcoded `speak()` strings (greet, empty-response, server-error) removed; greet is now a synthetic kickoff turn through `handleUserTurn`. Only `isStopIntent` remains hardcoded for instant-abort safety.
- Mobile pass + iOS safe-area: `viewport-fit=cover` on the Next.js viewport export, `env(safe-area-inset-*)` on every fixed mobile element, variant-aware AskParz button, portfolio-image clipping, compact mobile voice panel.
- Live deploy at https://portfolio-v4-test.fly.dev/ (Fly.io). All voice + chat + STT routes verified 200.

**Deferred at v4.1 close (resolved or carried forward later):**

- Resolved in v4.2: Wave 2 P1 audit findings in `21-AUDIT.md`: F-05 (openTextChat race), F-06 (STT session-started timeout), F-07 (SpeechSynthesis timeout), F-08 (registerToolCallbacks deregister), F-09 (tool callback try/catch).
- Still future work: API-03 live Amplify / custom-domain smoke test against `audienclature.com` (script ready at `scripts/verify-amplify-apis.mjs`, blocked on a reachable production URL).
- Resolved in v4.2: particle-background mobile performance, chat input iOS keyboard handling, project viewer mobile scope.
- Resolved in v4.2: FSB-04 (overlay action captions), FSB-05 (mobile-specific overlay treatment), CHAT-UI-01 (chat popup/page redesign).

---

## v4.0 Voice Mode Production (Shipped: 2026-04-26)

**Phases completed:** 4 phases, 14 plans, 10 tasks

**Key accomplishments:**

- Persistent voice session moved to layout-level providers so active voice state survives route changes.
- Voice commands now execute real page effects: project opening, section scrolling, navigation, links, theme toggles, and tour actions.
- Voice state visual feedback now uses viewport glow states for listening, executing, success, and error conditions.
- Speech-to-text now uses ElevenLabs Scribe v2 with a secure server-issued token and Web Speech fallback.
- Amplify build config now injects `ELEVENLABS_API_KEY` alongside `XAI_API_KEY` for server-side API routes.
- Chat, STT token, and TTS API routes returned successful live responses on the reachable deployment, with token/audio output sanitized.
- `scripts/verify-amplify-apis.mjs` is ready for future Amplify/custom-domain verification; live production smoke testing is deferred to API-03.

**Deferred:**

- API-03: Restore or identify a reachable Amplify production URL and run `PRODUCTION_BASE_URL="<AMPLIFY_URL>" node scripts/verify-amplify-apis.mjs`.

---
