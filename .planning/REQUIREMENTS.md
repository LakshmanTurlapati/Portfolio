# Requirements: Portfolio v4.0 Voice Mode Production

**Defined:** 2026-04-24
**Core Value:** A visually striking, interactive portfolio that showcases projects with rich detail, ambient animations, and an AI persona.

## v4.0 Requirements

### Voice Overlay

- [ ] **OVLY-01**: Voice session persists across page navigation -- activating voice on home page and navigating to portfolio keeps the voice overlay open and active
- [ ] **OVLY-02**: Ask Parz button appears in the navbar on all pages (home, portfolio, about, chat) and can activate voice mode from any page
- [ ] **OVLY-03**: ChatPopup (text chat) is accessible from any page when user switches from voice to text mode or clicks Ask Parz in text mode
- [ ] **OVLY-04**: VoiceBus state machine (idle, listening, thinking, speaking) maintains its state across route changes without resetting

### Tool Callbacks

- [ ] **TOOL-01**: User can say a project name and voice mode opens that project's detail view on the portfolio page
- [ ] **TOOL-02**: User can say a page name (portfolio, about, chat) and voice mode navigates to that page
- [ ] **TOOL-03**: User can say "scroll to experience" or "scroll to education" on the about page and the view scrolls to that section
- [ ] **TOOL-04**: User can say "open link" and voice mode opens the referenced URL in a new tab
- [ ] **TOOL-05**: User can say "toggle theme" or "switch to dark/light mode" and the theme changes
- [ ] **TOOL-06**: Tour mode works end-to-end across pages -- navigates, opens projects, and speaks descriptions without race conditions

### Speech-to-Text

- [ ] **STT-01**: Speech-to-text uses ElevenLabs Scribe v2 instead of Web Speech API for recognition
- [ ] **STT-02**: STT works in Chrome, Firefox, Safari, and Edge (cross-browser, no vendor prefix dependency)
- [ ] **STT-03**: Server-side /api/stt-token endpoint issues single-use tokens so the API key never reaches the browser

### Visual Feedback

- [ ] **VFBK-01**: Viewport border glows blue pulse while voice is in listening state
- [ ] **VFBK-02**: Viewport border glows amber while voice is executing a tool call (navigating, opening project, etc.)
- [ ] **VFBK-03**: Viewport border flashes green on successful tool call completion
- [ ] **VFBK-04**: Viewport border glows red on error state (API failure, mic denied, etc.)

### API Verification

- [ ] **API-01**: Voice mode and text chat both reach xAI Grok-3-mini via /api/chat and return real AI responses
- [ ] **API-02**: ElevenLabs TTS and STT keys are verified working in both local development and Amplify production environment

## v3 Requirements (Validated)

All v3 redesign requirements completed in milestone v3. See git history for details.

- ✓ PORT-06, PORT-07 (IframeViewer) -- v3
- ✓ HOME-01 through HOME-03 (Home Page) -- v3
- ✓ TRAN-01, TRAN-02 (Circular Reveal) -- v3
- ✓ VOIC-01 through VOIC-05 (Voice Mode Foundation) -- v3
- ✓ CHAT-01 through CHAT-03 (Chat Persona) -- v3
- ✓ ABUT-01 (About Spotlight) -- v3
- ✓ DATA-01 (Project Data) -- v3

## v1 Requirements (Validated)

- ✓ FOUN-01 through FOUN-05 (Foundation) -- v1.0
- ✓ NAV-01 through NAV-04 (Navigation) -- v1.0
- ✓ ANIM-01 through ANIM-07 (Canvas Animations) -- v1.0
- ✓ PAGE-01 through PAGE-08 (Pages) -- v1.0
- ✓ CHAT-01 through CHAT-06 (Chat) -- v1.0
- ✓ DEPLOY-01 through DEPLOY-03 (Deployment) -- v1.0

## Future Requirements

### Portfolio DataGrid (deferred from v3)

- **PORT-01**: DataGrid canvas background with pulsing dots and proximity reveal
- **PORT-02**: Mouse cursor proximity reveal with glow overlay
- **PORT-03**: Grid controls panel (H key) with randomize (R key)
- **PORT-04**: Per-project signature hover effects on DataGrid
- **PORT-05**: Project card click opens slide-in detail overlay
- **PORT-08**: GitHub rich repo preview card
- **DATA-02**: Per-project hover effect mapping

### Mobile Voice

- **MOBV-01**: Voice mode on mobile with touch-based controls
- **MOBV-02**: Mobile navbar voice panel layout

## Out of Scope

| Feature | Reason |
|---------|--------|
| New pages not in design | Design-driven only |
| Mobile app (Android/iOS) | Web only |
| Database / user auth | Not in current version |
| SEO optimization | Post-v4 |
| Mobile voice mode | Deferred to future milestone |
| DataGrid hover effects | Deferred from v3, not in v4.0 scope |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| OVLY-01 | Phase 12 | Pending |
| OVLY-02 | Phase 12 | Pending |
| OVLY-03 | Phase 12 | Pending |
| OVLY-04 | Phase 12 | Pending |
| TOOL-01 | Phase 13 | Pending |
| TOOL-02 | Phase 13 | Pending |
| TOOL-03 | Phase 13 | Pending |
| TOOL-04 | Phase 13 | Pending |
| TOOL-05 | Phase 13 | Pending |
| TOOL-06 | Phase 13 | Pending |
| VFBK-01 | Phase 13 | Pending |
| VFBK-02 | Phase 13 | Pending |
| VFBK-03 | Phase 13 | Pending |
| VFBK-04 | Phase 13 | Pending |
| STT-01 | Phase 14 | Pending |
| STT-02 | Phase 14 | Pending |
| STT-03 | Phase 14 | Pending |
| API-01 | Phase 15 | Pending |
| API-02 | Phase 15 | Pending |

**Coverage:**
- v4.0 requirements: 19 total
- Mapped to phases: 19
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-24*
*Last updated: 2026-04-24 after roadmap creation (Phases 12-15)*
