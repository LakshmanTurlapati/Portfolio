---
gsd_state_version: 1.0
milestone: v4.0
milestone_name: Voice Mode Production
status: planning
stopped_at: Phase 13 context gathered
last_updated: "2026-04-25T05:13:08.248Z"
last_activity: 2026-04-25
progress:
  total_phases: 4
  completed_phases: 1
  total_plans: 4
  completed_plans: 4
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-24)

**Core value:** A visually striking, interactive portfolio that showcases projects with rich detail, ambient animations, and an AI persona.
**Current focus:** Phase --phase — 12

## Current Position

Phase: 13
Plan: Not started
Status: Ready to plan
Last activity: 2026-04-25

```
v4.0 Progress: [                    ] 0% (0/4 phases)
```

## Performance Metrics

**Velocity:**

- Total plans completed: 30 (from v1.0 + v3)
- Average duration: ~4min
- Total execution time: ~0.5 hours

## Accumulated Context

### Decisions

- [v1.0]: Coarse granularity -- 4 phases grouping Foundation+Navigation, Animations+HomePage, ContentPages+Chat, Transitions+Deployment
- [v1.0]: Tailwind CSS v4 CSS-first config with @custom-variant dark for class-based dark mode
- [v1.0]: Data files pattern established in src/data/ with typed interfaces and exported const arrays
- [v3-session]: Several v3 components already implemented directly from design prototype (DataGrid, ProjectDetail, IframeViewer, GitHub Stats, Ask Parz, particles.js, portfolio page, project data) -- Phase 5 and 6 are validate/polish, not scratch builds
- [v3-session]: Circular reveal transition attempted 3 times but not matching Flutter ClipPath behavior -- isolated as Phase 7 for dedicated focus
- [v3]: Voice mode isolated as Phase 8 (largest new feature, Web Speech API, VoiceBus state machine)
- [05-01]: GithubPreview uses inline styles (not CSS classes) to avoid globals.css scope conflicts with IframeViewer
- [05-01]: Mermaid rendering intentionally omitted from GithubPreview (out-of-scope dependency)
- 05-03: PROJECT_DETAILS content ported verbatim from v3 prototype -- all 21 projects covered, DATA-01 satisfied
- Tooltip-based GitHub contribution scraping (not data-level which is 0-4 intensity; data-count removed ~2023)
- ISR revalidate=3600 on /api/github-stats caps upstream GitHub requests to 3/hour regardless of traffic
- ChatPopup uses useChat hook from @ai-sdk/react (same as chat/page.tsx) -- no raw fetch, consistent with existing infrastructure
- AskParzButton on mobile rendered in compact flex slot -- label hidden via existing max-[760px]:hidden class on button
- Particle cleanup audit Phase 6: all three steps confirmed correct (destroypJS → clear array → remove canvas)
- View Transitions API as primary circular reveal path with GSAP overlay fallback -- old page snapshot remains visible around expanding circle
- useRef guard (synchronous) + shadow useState (reactive) dual pattern for isTransitioning -- eliminates rapid-click race condition
- Safety setTimeout 600ms alongside transition.finished per T-07-04 threat mitigation
- Fixed prefer-const ESLint violation in data-grid.tsx -- const correct since Object.assign mutates in place
- All 5 circular reveal visual tests passed -- View Transitions API matches Flutter ClipPath behavior (Phase 7 complete)
- VoiceState/VoiceBusInstance in declare global{} (not module scope) so globally accessible without imports across all TS files
- ElevenLabs stream() cast to ReadableStream and passed directly to Response() -- for-await-of fails on ES2017 tsconfig target
- npm install --legacy-peer-deps needed for ElevenLabs due to pre-existing ai-sdk/react peer conflict with react@19.1.0
- SpeechRecognition typed as any -- TypeScript DOM lib does not expose SpeechRecognition/SpeechRecognitionEvent/SpeechRecognitionErrorEvent even with dom lib target
- streamTTS Promise wraps source.onended -- enables sequential await speak() in tour without event emitter complexity
- dispatchToolCall inside hook body -- single dispatch for all TOUR_STEPS tool calls; openProject wired via toolCallbacks, others console.warn on miss
- Import Flip from gsap/all to avoid macOS case-insensitive FS TS1149 casing conflict between gsap/Flip and gsap/flip
- VoiceNavProps = Omit<VoicePanelProps, 'isDark' | 'micDenied'> in navbars -- controller voiceProps excludes theme/mic fields that navbars inject themselves
- ParticleContainer type alias collocated in particle-background.tsx -- __vmTick is an implementation detail of breathing, not a VoiceBus concern
- breathCancelled + breathRaf are closure-local in init() -- ensures zero React re-renders; each theme-switch reinit gets an isolated breathing loop
- All 5 VOIC requirements verified end-to-end by human visual inspection -- navbar morph, STT, TTS, particle breathing, and voice commands all confirmed working
- [09-01]: PARZ_ERRORS displayed via currentError state (useEffect on error) -- never leak raw error.message to UI per T-09-01 threat mitigation
- [09-01]: DATA_STORE project names normalized to match projects.ts displayed names exactly so Parz can answer questions about all 21 projects
- SpotlightEffect uses CSS custom properties --mx/--my updated synchronously on mousemove -- eliminates setInterval/lerp overhead; opacity transition for show/hide; 500px radius matching v3 prototype
- [09-03]: All 4 Phase 9 requirements (CHAT-01, CHAT-02, CHAT-03, ABUT-01) confirmed working by human visual inspection -- Phase 9 complete
- isUnembeddable exported directly from iframe-viewer.tsx -- single source of truth for embeddability checks shared with portfolio/page.tsx
- openProject calls setViewer directly on card click -- matches v3 D-01/D-02; ProjectDetail retained for secondary access via onOpenLink (D-03)
- All 5 circular reveal visual tests passed (Phase 10): View Transitions API + WAAPI clip-path on ::view-transition-new(root) confirmed working, TRAN-01 and TRAN-02 satisfied
- [v4.0-roadmap]: Persistent overlay (Phase 12) is the unambiguous prerequisite gate -- every other v4.0 feature requires or benefits from VoiceSessionProvider at layout level
- [v4.0-roadmap]: Tool callbacks and visual feedback combined into Phase 13 (coarse granularity) -- both require stable layout-level session, neither adds new architectural risk
- [v4.0-roadmap]: STT isolated as Phase 14 -- AudioWorklet + WebSocket has the highest technical risk in the milestone; validate with standalone test before integrating into voice-controller.ts
- [v4.0-roadmap]: @elevenlabs/client v1.3.1 is the browser-safe STT SDK (ScribeRealtime in elevenlabs-js is Node.js-only -- confirmed from type declarations)
- [v4.0-roadmap]: Separate sttCtx (16kHz AudioContext) mandatory -- sharing VoiceBus._ctx with STT creates TTS echo feedback loop
- [v4.0-roadmap]: /api/stt-token route issues 15-minute single-use tokens -- NEXT_PUBLIC_ELEVENLABS_API_KEY must never be used
- openTextChat dispatches parz:open-text-chat CustomEvent with 400ms delay for View Transitions API compatibility
- currentPage derived dynamically from usePathname() in VoiceSessionProvider — not hardcoded as 'home'
- VoiceOverlay returns null on pathname === '/' to prevent double panel — home page renders its own VoicePanel inside navbar morph
- VoiceSessionProvider inside VoiceBusProvider in layout.tsx — useVoiceController depends on window.VoiceBus which VoiceBusProvider initializes
- useVoiceController has exactly one call site (voice-session-provider.tsx) — page.tsx consumes voice state via useVoiceSession() context
- parz:open-text-chat CustomEvent listener registered in page.tsx useEffect — allows VoiceSessionProvider.openTextChat to trigger ChatPopup from layout level

### Pending Todos

- Plan Phase 12: Persistent Voice Overlay (VoiceSessionProvider + LayoutShell)
- Verify @elevenlabs/client v1.3.1 installs without peer dependency conflicts before Phase 14
- Verify openProject slug casing against src/data/projects.ts before Phase 13 (TOUR_STEPS uses 'Parz-AI' -- confirm exact field name)

### Blockers/Concerns

- [v4.0]: AudioWorklet chunk size and downsampling strategy need profiling against actual Scribe WebSocket -- validate with isolated test script before Phase 14 integration
- [v4.0]: Barge-in threshold (currently 0.15) may cause Parz to interrupt its own TTS at full volume -- likely raise to 0.35 or disable during speaking state; calibrate in Phase 14

## Session Continuity

Last session: --stopped-at
Stopped at: Phase 13 context gathered
Resume file: --resume-file

**Next:** Plan Phase 12 -- run `/gsd-plan-phase 12`

**Planned Phase:** 12 (Persistent Voice Overlay) — 4 plans — 2026-04-25T01:42:25.863Z
