# Roadmap: Portfolio V2 -- Next.js Migration

## Milestones

- ✅ **v1.0 Migration** - Phases 1-4 (in progress — Phase 4 partially complete)
- ✅ **v3 Portfolio Redesign** - Phases 5-11 (complete)
- 🚧 **v4.0 Voice Mode Production** - Phases 12-15 (in progress)

## Phases

<details>
<summary>✅ v1.0 Migration (Phases 1-4)</summary>

### Phase 1: App Shell and Navigation
**Goal**: Users can navigate between all four pages with working dark/light theme and responsive layout
**Depends on**: Nothing (first phase)
**Requirements**: FOUN-01, FOUN-02, FOUN-03, FOUN-04, FOUN-05, NAV-01, NAV-02, NAV-03, NAV-04
**Success Criteria** (what must be TRUE):
  1. App loads with correct Lato font, no layout shift, and detects system theme preference on first visit
  2. User can toggle between dark and light theme without page reload, and theme colors apply consistently across all placeholder pages
  3. Desktop navbar shows Portfolio button, About Me link, and social icons; mobile navbar shows bottom bar with same elements -- both switch at 600px breakpoint
  4. Clicking any navigation link routes to the correct page; social icons open GitHub/LinkedIn/X in new tabs
**Plans:** 3 plans

Plans:
- [x] 01-01-PLAN.md -- Initialize Next.js 15 project with Tailwind v4, theme provider, fonts, and utilities
- [x] 01-02-PLAN.md -- Build theme toggle (sun/separator/moon) and author name components
- [x] 01-03-PLAN.md -- Build navigation bars, placeholder pages, and assemble home page

**UI hint**: yes

### Phase 2: Home Page and Canvas Animations
**Goal**: Home page displays all visual effects at 60fps matching the Flutter version's look and feel
**Depends on**: Phase 1
**Requirements**: ANIM-01, ANIM-02, ANIM-03, ANIM-04, ANIM-05, ANIM-06, ANIM-07, PAGE-01
**Success Criteria** (what must be TRUE):
  1. Home page renders particle background, snowfall, dot matrix, rotating circular text, and spotlight effect with correct layering matching the Flutter version
  2. All canvas animations run at 60fps on both desktop and mobile without jank or dropped frames
  3. Spotlight effect follows cursor on desktop and touch on mobile, matching Flutter's interpolation behavior
  4. Navigating away from the home page and returning does not leak memory -- animations clean up on unmount and reinitialize correctly
**Plans:** 4 plans

Plans:
- [x] 02-01-PLAN.md -- useCanvas hook, CSS custom properties, particle background, and snowfall canvas effects
- [x] 02-02-PLAN.md -- Dot matrix grid, rotating circular text SVG, and spotlight CSS overlay
- [x] 02-03-PLAN.md -- Scrolling text focal point with desktop and mobile variants
- [x] 02-04-PLAN.md -- Home page assembly wiring all effects with z-index layering

**UI hint**: yes

### Phase 3: Content Pages and Chat
**Goal**: Portfolio, About, and Chat pages are fully functional with content matching the Flutter version and working AI chat
**Depends on**: Phase 1
**Requirements**: PAGE-02, PAGE-03, PAGE-04, PAGE-05, PAGE-06, PAGE-07, PAGE-08, CHAT-01, CHAT-02, CHAT-03, CHAT-04, CHAT-05, CHAT-06
**Success Criteria** (what must be TRUE):
  1. Portfolio page displays all projects in a staggered/masonry grid with images, names, and links matching the Flutter version layout
  2. About page displays bio, experience timeline/cards, and education section with scrollable section navigation matching Flutter version
  3. User can send a message in the chat and receive a streaming response from xAI Grok, with conversation history preserved during the session
  4. Chat API key is not exposed in the client bundle -- API calls go through a Next.js server-side route
  5. Error states in chat display user-friendly messages; links in chat responses are automatically detected and clickable
**Plans:** 3 plans

Plans:
- [x] 03-01-PLAN.md -- Portfolio page with masonry grid, project data, asset images, and snowfall overlay
- [x] 03-02-PLAN.md -- About page with bio, experience timeline, education, sidebar navigation, and spotlight overlay
- [x] 03-03-PLAN.md -- Chat page with xAI Grok API integration, streaming responses, and message UI

**UI hint**: yes

### Phase 4: Page Transitions and Deployment
**Goal**: All inter-page navigation uses circular reveal transitions and the application is live on AWS Amplify
**Depends on**: Phase 1, Phase 2, Phase 3
**Requirements**: TRANS-01, TRANS-02, TRANS-03, DEPLOY-01, DEPLOY-02, DEPLOY-03
**Success Criteria** (what must be TRUE):
  1. Navigating between any two pages triggers a circular reveal transition that originates from the clicked navigation element's position
  2. Circular reveal transition works correctly for both forward and backward navigation (including browser back button)
  3. Application builds, deploys, and serves correctly on AWS Amplify at the production domain with environment variables accessible to API routes
**Plans:** 2 plans

Plans:
- [ ] 04-01-PLAN.md -- Circular reveal page transitions with clip-path animation
- [x] 04-02-PLAN.md -- AWS Amplify deployment configuration with env var injection

</details>

<details>
<summary>✅ v3 Portfolio Redesign (Phases 5-11)</summary>

### Phase 5: Portfolio Page and Data
**Goal**: Users can interact with a fully polished v3 portfolio -- DataGrid canvas background, per-project hover effects, slide-in detail overlays, and IframeViewer previews
**Depends on**: Phase 3
**Requirements**: PORT-01, PORT-02, PORT-03, PORT-04, PORT-05, PORT-06, PORT-07, PORT-08, DATA-01, DATA-02
**Success Criteria** (what must be TRUE):
  1. Portfolio page shows a pulsing dot grid background; hovering the canvas reveals nearby dots and a glow; pressing H opens the grid controls panel and R randomizes parameters
  2. Hovering a project card triggers that project's assigned signature effect on the DataGrid (each of 21 projects has a distinct effect type mapped)
  3. Clicking a project card slides in a detail overlay showing tagline, year, role, stack, stats, highlights, and rich sections -- content is filled for at least 13 key projects
  4. Clicking Website, GitHub, or Design links in the overlay opens the IframeViewer: Figma and web links embed directly, YouTube URLs convert to embed players, GitHub links show a rich repo card with README and metadata, and unembeddable hosts show a fallback CTA
**Plans:** 3 plans

Plans:
- [x] 05-01-PLAN.md -- GithubPreview component (PORT-08) and IframeViewer routing for GitHub URLs
- [ ] 05-02-PLAN.md -- Visual audit: Instrument Serif fonts, stats grid, dash bullets, card hover polish
- [ ] 05-03-PLAN.md -- Fill all 8 missing project detail writeups (DATA-01 complete coverage)

**UI hint**: yes

### Phase 6: Home Page and Ambient Backgrounds
**Goal**: Users see a particles.js connected-node mesh on the home page and a GitHub Stats pill, and the navbar offers the Ask Parz entry point with ambient orbs
**Depends on**: Phase 2
**Requirements**: HOME-01, HOME-02, HOME-03
**Success Criteria** (what must be TRUE):
  1. Home page background is a monochrome connected-node mesh (particles.js) with grab and push mouse interactivity that reinitializes correctly when the user switches dark/light theme
  2. A GitHub Stats pill at bottom-center displays live contribution count, streak, star count, and repo count; hovering expands a detail panel
  3. Navbar shows an Ask Parz button with ambient blurred orbs, a green status dot, and hover amplification on both desktop and mobile
**Plans:** 2 plans

Plans:
- [x] 06-01-PLAN.md -- GitHub Stats live data pipeline: /api/github-stats route + wire github-stats.tsx to live fetch
- [x] 06-02-PLAN.md -- ChatPopup component, Ask Parz wiring (desktop + mobile), particle-background audit

**UI hint**: yes

### Phase 7: Circular Reveal Transition
**Goal**: Navigating between pages produces a circular reveal that clips the incoming page content expanding from the origin point, matching Flutter's ClipPath behavior
**Depends on**: Phase 4
**Requirements**: TRAN-01, TRAN-02
**Success Criteria** (what must be TRUE):
  1. Clicking any navigation link triggers a circular reveal: the new page content is clipped inside an expanding circle that originates from the clicked element's screen position
  2. The old page remains visible outside the expanding circle throughout the animation -- it is not hidden, faded, or replaced until the circle fully covers the viewport
  3. The transition works for all navigation paths (home, portfolio, about, chat) and does not break on rapid successive clicks or browser back navigation
**Plans:** 2 plans

Plans:
- [x] 07-01-PLAN.md -- Rewrite TransitionProvider with View Transitions API + CSS reset + Next.js config flag
- [x] 07-02-PLAN.md -- Human visual verification of circular reveal across all navigation paths

**UI hint**: yes

### Phase 8: Voice Mode
**Goal**: Users can speak to Parz -- voice mode activates from the navbar, the navbar morphs into a voice panel, and the full speech-to-text/text-to-speech pipeline runs with visual feedback
**Depends on**: Phase 6
**Requirements**: VOIC-01, VOIC-02, VOIC-03, VOIC-04, VOIC-05
**Success Criteria** (what must be TRUE):
  1. Clicking Ask Parz activates voice mode and the navbar visually morphs into a voice control panel showing current state (idle, listening, thinking, speaking)
  2. In listening state, the mic captures speech via Web Speech API and displays a live amplitude waveform visualization; the recognized transcript is visible before submission
  3. After a voice query, Parz responds with synthesized speech (ElevenLabs eleven_turbo_v2_5 via /api/tts proxy) with a real amplitude envelope animation; the particles mesh breathes in sync with VoiceBus state
  4. User can say a page name to navigate, say "text" or click to switch to the chat text interface, or say "stop" / click to exit voice mode
**Plans:** 5 plans

Plans:
- [x] 08-01-PLAN.md -- VoiceBus types, init module, provider, and ElevenLabs TTS proxy route
- [x] 08-02-PLAN.md -- Voice controller hook: STT, AI agent loop, voice commands, tour, barge-in, memory, accessibility
- [x] 08-03-PLAN.md -- VoiceWave + VoicePanel components, desktop GSAP Flip morph, mobile CSS morph, page.tsx wiring
- [x] 08-04-PLAN.md -- Particle breathing rAF loop integration in ParticleBackground
- [x] 08-05-PLAN.md -- Human visual verification of full voice mode

**UI hint**: yes

### Phase 9: Chat, About, and Polish
**Goal**: Chat uses the full Parz persona with complete data store, quality-of-life improvements are live, and the About page has a cursor spotlight effect
**Depends on**: Phase 5, Phase 6, Phase 7, Phase 8
**Requirements**: CHAT-01, CHAT-02, CHAT-03, ABUT-01
**Success Criteria** (what must be TRUE):
  1. Sending a message to Parz produces responses grounded in the full DATA_STORE (bio, education, experience, all 21 projects, hobbies, philosophy) -- Parz answers accurately about specific projects and background
  2. While waiting for a response, the user sees a rotating loading message; if the API fails, a random friendly error message appears (not a raw error string)
  3. The suggestion pool shows one small and one big question chip at the start of a conversation; chips disappear after the user sends 2 messages
  4. Moving the cursor over the About page produces a soft spotlight that follows the cursor position via CSS custom properties
**Plans:** 3 plans

Plans:
- [x] 09-01-PLAN.md -- Parz error messages array, DATA_STORE project name audit (all 21 projects), verify chips and loading
- [x] 09-02-PLAN.md -- About page spotlight rewrite to CSS custom property approach (--mx/--my)
- [x] 09-03-PLAN.md -- Human visual verification of all Phase 9 changes

**UI hint**: yes

### Phase 10: Circular Reveal Fix
**Goal**: Debug and fix the circular reveal page transition -- the View Transitions API + WAAPI clip-path implementation needs deep investigation into why animations are not visible despite correct code structure. Also implement Portfolio button to back button hero morph.
**Depends on**: Phase 7
**Requirements**: TRAN-01, TRAN-02
**Success Criteria** (what must be TRUE):
  1. Clicking any navigation link triggers a visible circular reveal animation expanding from the clicked element's position
  2. The old page remains visible outside the expanding circle until it fully covers the viewport
  3. The Portfolio button visually morphs into the back button on the destination page during the transition (Flutter Hero equivalent)
  4. Back button click triggers a circular reveal from its position back to the home page
  5. Works in Chrome, Edge, Firefox, and Safari
**Plans:** 1/1 plans complete

Plans:
- [x] 10-01-PLAN.md -- Verify fix (remove hero-nav-btn duplicates) and human visual verification of circular reveal

**UI hint**: yes

### Phase 11: IframeViewer Browser Previews
**Goal**: IframeViewer shows lightweight browser-frame previews for project links -- matching the v3 design prototype's embedded web/Figma/YouTube viewers with browser chrome UI, loading states, and fallback CTAs for unembeddable hosts
**Depends on**: Phase 5
**Requirements**: PORT-06, PORT-07
**Success Criteria** (what must be TRUE):
  1. Clicking a Website link in the project detail overlay opens the IframeViewer with a browser-frame UI (address bar, close button, external link button)
  2. Figma links embed directly via Figma's embed API; YouTube URLs convert to embed players
  3. GitHub links show the rich GithubPreview card (already built in Phase 5)
  4. Unembeddable hosts (Chrome Web Store, LinkedIn, etc.) show a styled fallback CTA instead of a broken iframe
**Plans:** 1/1 plans complete

Plans:
- [x] 11-01-PLAN.md -- Export isUnembeddable, rewrite openProject to open IframeViewer directly with link-priority routing

**UI hint**: yes

</details>

---

## v4.0 Voice Mode Production (Phases 12-15)

**Milestone Goal:** Make voice mode fully functional and production-ready -- persistent overlay across navigation, wired tool callbacks, ElevenLabs STT upgrade, and verified API connectivity on Amplify.

- [x] **Phase 12: Persistent Voice Overlay** - Lift voice session to layout level so it survives page navigation (completed 2026-04-25)
- [x] **Phase 13: Tool Callbacks and Visual Feedback** - Wire all tool actions to real page effects and add viewport glow states (completed 2026-04-25)
- [ ] **Phase 14: ElevenLabs STT Upgrade** - Replace Web Speech API with Scribe v2 for cross-browser transcription
- [ ] **Phase 15: API Verification and Deployment** - Confirm all API routes and keys work in Amplify production

## Phase Details

### Phase 12: Persistent Voice Overlay
**Goal**: Voice session survives page navigation -- activating voice on any page and navigating keeps the overlay open, state intact, and Ask Parz reachable everywhere
**Depends on**: Phase 11
**Requirements**: OVLY-01, OVLY-02, OVLY-03, OVLY-04
**Success Criteria** (what must be TRUE):
  1. User opens voice mode on the home page, navigates to portfolio, and the VoicePanel stays rendered with its previous state (listening/thinking/speaking) -- no reset or disappearance
  2. Ask Parz button is visible and functional in the home page navbar; once voice is active, the overlay persists across all pages
  3. Switching from voice to text mode on a non-home page navigates to home and opens ChatPopup
  4. VoiceBus state machine (idle, listening, thinking, speaking) does not reset mid-session when the route changes
**Plans:** 4/4 plans complete

Plans:
- [x] 12-01-PLAN.md -- Create VoiceSessionProvider: lift useVoiceController to layout level via React context
- [x] 12-02-PLAN.md -- Create VoiceOverlay component + wire VoiceSessionProvider into layout.tsx
- [x] 12-03-PLAN.md -- Refactor page.tsx to consume VoiceSessionContext instead of owning useVoiceController
- [x] 12-04-PLAN.md -- Human visual verification of voice persistence across all navigation paths

**UI hint**: yes

### Phase 13: Tool Callbacks and Visual Feedback
**Goal**: Voice commands produce real effects -- spoken tool intents execute on-screen actions and the viewport border communicates voice state through color-coded glows
**Depends on**: Phase 12
**Requirements**: TOOL-01, TOOL-02, TOOL-03, TOOL-04, TOOL-05, TOOL-06, VFBK-01, VFBK-02, VFBK-03, VFBK-04
**Success Criteria** (what must be TRUE):
  1. Saying a project name opens that project's detail view on the portfolio page; the tour step navigates to portfolio, opens the project, and speaks the description without a race condition
  2. Saying "go to about" (or any page name) navigates to that page; saying "scroll to experience" on the about page scrolls to that section
  3. Saying "open link" opens the referenced URL in a new tab; saying "toggle theme" or "switch to dark mode" applies the theme change immediately
  4. Viewport border glows blue while listening, amber while a tool call is executing, green on successful completion, and red on error -- each glow state is visually distinct and resolves cleanly
**Plans:** 4/4 plans complete

Plans:
- [x] 13-01-PLAN.md -- Extend VoiceSessionProvider with registerToolCallbacks + fix dispatchToolCall signals + fix startTour race condition
- [x] 13-02-PLAN.md -- Create VoiceGlow component, add CSS keyframes to globals.css, mount in layout.tsx
- [x] 13-03-PLAN.md -- Register openProject callback in portfolio/page.tsx and scrollTo in about/page.tsx with page-ready signals
- [x] 13-04-PLAN.md -- Human visual verification of all 10 Phase 13 requirements
**UI hint**: yes

### Phase 14: ElevenLabs STT Upgrade
**Goal**: Speech recognition uses ElevenLabs Scribe v2 over a secure server-issued token, works in all major browsers, and no longer depends on the Chrome-only Web Speech API
**Depends on**: Phase 12
**Requirements**: STT-01, STT-02, STT-03
**Success Criteria** (what must be TRUE):
  1. Speaking into the mic in Firefox and Safari produces a recognized transcript -- voice mode is not silently broken in non-Chrome browsers
  2. The ElevenLabs API key is never present in the browser bundle or network requests from the client; the browser uses a 15-minute single-use token fetched from /api/stt-token
  3. Transcription latency is perceptibly lower than Web Speech API and partial transcripts appear while the user is still speaking
**Plans:** 3 plans

Plans:
- [x] 14-01-PLAN.md -- /api/stt-token server route and public/pcm-processor.js AudioWorklet
- [ ] 14-02-PLAN.md -- voice-controller.ts: replace startListening() with ElevenLabs Scribe v2 + silent fallback
- [ ] 14-03-PLAN.md -- Human verification: STT-01, STT-02, STT-03 confirmed in browser

### Phase 15: API Verification and Deployment
**Goal**: All voice and chat API routes return real AI responses in Amplify production -- no 503s from missing env vars and both ElevenLabs keys verified working end-to-end
**Depends on**: Phase 14
**Requirements**: API-01, API-02
**Success Criteria** (what must be TRUE):
  1. Sending a text chat message and making a voice query both return real Grok-3-mini responses (not fallback errors) in the deployed Amplify environment
  2. POST /api/stt-token returns 200 with a token in production; POST /api/tts returns audio in production -- confirming ElevenLabs keys are injected into the Lambda runtime
**Plans**: TBD

---

## Progress

**Execution Order:**
v1.0 phases 1-4, then v3 phases 5-11, then v4.0 phases 12-15.
12 → 13 → 14 → 15

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. App Shell and Navigation | v1.0 | 3/3 | Complete | 2026-04-03 |
| 2. Home Page and Canvas Animations | v1.0 | 4/4 | Complete | 2026-04-03 |
| 3. Content Pages and Chat | v1.0 | 3/3 | Complete | 2026-04-03 |
| 4. Page Transitions and Deployment | v1.0 | 1/2 | In progress | - |
| 5. Portfolio Page and Data | v3 | 0/3 | Not started | - |
| 6. Home Page and Ambient Backgrounds | v3 | 2/2 | Complete | 2026-04-24 |
| 7. Circular Reveal Transition | v3 | 2/2 | Complete | 2026-04-24 |
| 8. Voice Mode | v3 | 5/5 | Complete | 2026-04-24 |
| 9. Chat, About, and Polish | v3 | 3/3 | Complete | 2026-04-24 |
| 10. Circular Reveal Fix | v3 | 1/1 | Complete | 2026-04-24 |
| 11. IframeViewer Browser Previews | v3 | 1/1 | Complete | 2026-04-24 |
| 12. Persistent Voice Overlay | v4.0 | 4/4 | Complete    | 2026-04-25 |
| 13. Tool Callbacks and Visual Feedback | v4.0 | 4/4 | Complete    | 2026-04-25 |
| 14. ElevenLabs STT Upgrade | v4.0 | 1/3 | In progress | - |
| 15. API Verification and Deployment | v4.0 | 0/? | Not started | - |
