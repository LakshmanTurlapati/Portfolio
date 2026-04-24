# Milestone Archive: v3 Portfolio Redesign

**Status:** Complete
**Phases:** 6-11 (6 phases, 14 plans)
**Completed:** 2026-04-24
**Milestone Goal:** Implement the v3 design overhaul -- interactive DataGrid portfolio, voice AI mode, faithful circular reveal transition, ambient home page backgrounds, and chat/about polish.

## Phases

### Phase 5: Portfolio Page and Data (Partial)
- 05-01: GithubPreview component + IframeViewer routing -- Complete
- 05-02: Visual audit (Instrument Serif fonts, stats grid) -- Not executed
- 05-03: Fill missing project detail writeups -- Not executed

### Phase 6: Home Page and Ambient Backgrounds -- Complete
- 06-01: GitHub Stats live data pipeline (/api/github-stats + component wiring)
- 06-02: ChatPopup overlay + Ask Parz button wiring + particle background audit

### Phase 7: Circular Reveal Transition -- Complete
- 07-01: TransitionProvider rewrite with View Transitions API + CSS reset + config
- 07-02: Human visual verification (5 tests passed)

### Phase 8: Voice Mode -- Complete
- 08-01: VoiceBus types, init, provider, hook, /api/tts ElevenLabs proxy
- 08-02: Voice controller (STT, AI agent loop, commands, tour, barge-in, memory, a11y)
- 08-03: VoiceWave + VoicePanel + GSAP Flip navbar morph + page.tsx wiring
- 08-04: Particle breathing rAF loop (two-sine 1.6/4.2 Hz)
- 08-05: Human visual verification (6 checkpoints passed)

### Phase 9: Chat, About, and Polish -- Complete
- 09-01: Parz-persona error messages + DATA_STORE audit (21 projects aligned)
- 09-02: SpotlightEffect CSS custom property rewrite
- 09-03: Human visual verification (5 checks passed)

### Phase 10: Circular Reveal Fix -- Complete
- 10-01: Removed duplicate view-transition-name (hero-nav-btn), added .catch() handlers

### Phase 11: IframeViewer Browser Previews -- Complete
- 11-01: Card click opens IframeViewer directly (not side panel)

## Key Decisions

- ElevenLabs streaming TTS with voice ID dMWVPH9DSxWOMrrrUso3 (not Web Speech Synthesis)
- Hybrid VoiceBus: window global for rAF data + React context for UI state
- GSAP Flip for desktop navbar morph, CSS height transition for mobile
- View Transitions API for circular reveal with GSAP fallback
- view-transition-name causes silent transition abort if duplicated -- removed hero morph

## Known Issues / Tech Debt

- Phase 5 plans 05-02 (visual audit) and 05-03 (project writeups) not executed
- Hero button morph (Portfolio button ↔ back button) deferred due to view-transition-name duplicate issue
- Code review findings from Phase 6 and 7 not addressed (advisory)
- Phase 4 plan 04-01 (v1.0 circular reveal) superseded by Phase 10
