# Requirements: Portfolio V3 Redesign

**Defined:** 2026-04-23
**Core Value:** A visually striking, interactive portfolio that showcases projects with rich detail, ambient animations, and an AI persona.

## v3 Requirements

### Portfolio Page

- [ ] **PORT-01**: User sees a pulsing dot grid canvas background with configurable cell size, spacing, duration, and animation type
- [ ] **PORT-02**: User's mouse cursor triggers proximity reveal (nearby dots brighten and scale up) and a glow overlay
- [ ] **PORT-03**: User can open a grid controls panel (H key) to adjust all DataGrid parameters and randomize (R key)
- [ ] **PORT-04**: Hovering a project card triggers a signature visual effect on the DataGrid (one of 10 types mapped per project)
- [ ] **PORT-05**: User can click a project card to open a slide-in detail overlay with tagline, year, role, stack, stats, highlights, and sections
- [x] **PORT-06
**: User can click Website/GitHub/Design links in the detail overlay to open an IframeViewer modal
- [x] **PORT-07
**: IframeViewer embeds Figma and web links, converts YouTube URLs to embeds, and shows a fallback CTA for unembeddable hosts
- [ ] **PORT-08**: GitHub links render a rich repo preview card with README, contributors, languages, and repo metadata via the GitHub API

### Home Page

- [x] **HOME-01
**: Home page background uses a particles.js connected-node mesh with grab and push interactivity, monochrome palette, and theme-aware re-init
- [x] **HOME-02
**: User sees a GitHub Stats pill at bottom-center showing contributions, streak, stars, and repos with an expandable hover panel
- [x] **HOME-03
**: Navbar includes an Ask Parz button with ambient blurred orbs, green status dot, and hover amplification

### Page Transitions

- [x] **TRAN-01
**: Navigating between pages triggers a circular reveal that clips the NEW page content, expanding from the clicked element's position (matching Flutter ClipPath)
- [x] **TRAN-02
**: The old page remains visible around the expanding circle until the reveal covers the viewport

### Voice Mode

- [x] **VOIC-01
**: Clicking Ask Parz opens voice mode where the navbar morphs into a voice control panel
- [x] **VOIC-02
**: Voice mode uses Web Speech API (SpeechRecognition) for STT with live mic amplitude visualization
- [x] **VOIC-03
**: Voice mode uses Web Speech Synthesis for TTS with fake amplitude envelope
- [x] **VOIC-04
**: VoiceBus manages state (idle, listening, thinking, speaking) and drives particle mesh breathing animation
- [x] **VOIC-05
**: User can navigate pages, switch to text chat, or stop via voice commands

### Chat & Persona

- [x] **CHAT-01**: Chat uses the full Parz system prompt with complete DATA_STORE (bio, education, experience, projects, hobbies, philosophy)
- [x] **CHAT-02**: Chat shows rotating loading messages and random friendly error messages
- [x] **CHAT-03**: Suggestion pool shows one small + one big question, hidden after 2 user messages

### About Page

- [x] **ABUT-01
**: About page has a cursor-following spotlight effect via CSS custom properties

### Data

- [x] **DATA-01
**: Project data includes all 21 projects with rich detail writeups for at least 13 key projects
- [ ] **DATA-02**: Per-project hover effect mapping assigns one of 10 effect types to each project

## v1 Requirements (Validated)

All v1 migration requirements completed in milestone v1.0. See git history for details.

- ✓ FOUN-01 through FOUN-05 (Foundation) -- v1.0
- ✓ NAV-01 through NAV-04 (Navigation) -- v1.0
- ✓ ANIM-01 through ANIM-07 (Canvas Animations) -- v1.0
- ✓ PAGE-01 through PAGE-08 (Pages) -- v1.0
- ✓ CHAT-01 through CHAT-06 (Chat) -- v1.0
- ✓ DEPLOY-01 through DEPLOY-03 (Deployment) -- v1.0
- ⚠️ TRANS-01 through TRANS-03 (Page Transitions) -- partially done, revisiting in v3 as TRAN-01/02

## Future Requirements

### Mobile Voice

- **MOBV-01**: Voice mode on mobile with touch-based controls
- **MOBV-02**: Mobile navbar voice panel layout

## Out of Scope

| Feature | Reason |
|---------|--------|
| New pages not in v3 design | Design-driven only |
| Mobile app (Android/iOS) | Web only |
| Database / user auth | Not in current version |
| SEO optimization | Post-v3 |
| Mermaid diagram rendering | Complex dependency, defer |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PORT-01 | Phase 5 | Pending |
| PORT-02 | Phase 5 | Pending |
| PORT-03 | Phase 5 | Pending |
| PORT-04 | Phase 5 | Pending |
| PORT-05 | Phase 5 | Pending |
| PORT-06 | Phase 5 | Pending |
| PORT-07 | Phase 5 | Pending |
| PORT-08 | Phase 5 | Pending |
| HOME-01 | Phase 6 | Pending |
| HOME-02 | Phase 6 | Pending |
| HOME-03 | Phase 6 | Pending |
| TRAN-01 | Phase 7 | Pending |
| TRAN-02 | Phase 7 | Pending |
| VOIC-01 | Phase 8 | Pending |
| VOIC-02 | Phase 8 | Pending |
| VOIC-03 | Phase 8 | Pending |
| VOIC-04 | Phase 8 | Pending |
| VOIC-05 | Phase 8 | Pending |
| CHAT-01 | Phase 9 | Complete |
| CHAT-02 | Phase 9 | Complete |
| CHAT-03 | Phase 9 | Complete |
| ABUT-01 | Phase 9 | Complete |
| DATA-01 | Phase 5 | Pending |
| DATA-02 | Phase 5 | Pending |

**Coverage:**
- v3 requirements: 24 total
- Mapped to phases: 24/24
- Unmapped: 0

---
*Requirements defined: 2026-04-23*
*Last updated: 2026-04-23 after roadmap creation (Phases 5-9)*
*Last updated: 2026-04-23 after initial definition*
