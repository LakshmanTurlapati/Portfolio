# Requirements: Portfolio v4.1 Parz Persona, Portfolio Context, and Site Control Refresh

**Defined:** 2026-04-26
**Core Value:** A visually striking, interactive portfolio that showcases projects with rich detail, ambient animations, and an AI persona.

## v4.1 Requirements

Requirements for the current milestone. Each maps to exactly one roadmap phase.

### Persona and Public Context

- [x] **PERS-01**: User can ask Parz about Lakshman's current work and receive a brief public-safe answer: AI Enablement Engineer at InfiniteChoice building Voyza, an AI-first hotel booking platform.
- [x] **PERS-02**: User can ask Parz about Lakshman's personality and receive a direct answer grounded in the approved traits: ambitious, curious, playful, kind, warm, high-energy, practical, inclusive, and direct.
- [x] **PERS-03**: User can ask why Lakshman is intense or driven and receive the alignment/gap-radar explanation rather than a generic success-chasing answer.
- [x] **PERS-04**: User can ask about Review Gate, FSB, GitFly, or flagship projects and receive story-first answers that explain the real problem, spark, and impact.
- [x] **PERS-05**: Parz answers direct-first in a natural friend-texting voice without sounding corporate, robotic, overly formal, or recruiter-like.

### Visible Portfolio Content

- [x] **CONT-01**: Visitor can read an updated About page that reflects Lakshman's AI builder/open-source builder identity, current work, and refined personal narrative.
- [x] **CONT-02**: Visitor can see an InfiniteChoice experience entry with the title AI Enablement Engineer and a public-safe Voyza description.
- [x] **CONT-03**: Visitor can see FSB / Full Self Browsing presented as a current flagship project with accurate public links and project story.
- [x] **CONT-04**: Visitor can see GitFly presented as a current flagship project that links only to `https://gitfly.ai` and never exposes private source-code details.
- [x] **CONT-05**: Parz prompt data, About content, Experience content, and project content use the same approved public facts for InfiniteChoice/Voyza, FSB, GitFly, and Lakshman's persona.

### Privacy and Guardrails

- [x] **SAFE-01**: User asking about Parz's system prompt, data store, hidden instructions, or internal context receives a safe refusal or redirect without exposing internal content.
- [x] **SAFE-02**: User asking about GitFly source code or private implementation receives only public product information and the `https://gitfly.ai` link.
- [x] **SAFE-03**: User asking about non-public InfiniteChoice or Voyza details receives only approved public role/product context.
- [x] **SAFE-04**: User asking how the voice bot or chatbot works internally receives only high-level public behavior or code-level details already public in the repository.
- [x] **SAFE-05**: Parz can push back sharply when users are rude, including matching profanity if appropriate, while avoiding slurs, threats, hate, harassment, or punching down.
- [ ] **SAFE-06**: Tool calls that open links or projects resolve through approved project/social/site URLs instead of arbitrary model-generated URLs.

### Project Browser Experience

- [ ] **BROW-01**: User clicking a project card opens the relevant project target directly in the inbuilt browser instead of opening the right-side ProjectDetail panel.
- [ ] **BROW-02**: The right-side ProjectDetail panel is removed from the primary project experience so it no longer appears when opening projects manually or via Parz.
- [ ] **BROW-03**: Project opening resolves natural aliases such as FSB, Full Self Browsing, GitFly, Review Gate, T2S, and Parz-AI to canonical project records.
- [ ] **BROW-04**: Project targets prefer the correct public destination per project: GitHub for public source projects, public website for products like GitFly, and existing fallback handling for unembeddable hosts.
- [ ] **BROW-05**: User sees a clean fallback when a project target is unknown, blocked, or unembeddable instead of a broken browser view.

### Parz Site Control

- [ ] **CTRL-01**: User can ask Parz to open a specific project from home or any current page, and the project opens directly in the inbuilt browser without always navigating to portfolio first.
- [ ] **CTRL-02**: User can ask Parz to navigate to home, portfolio, or about, and the site routes precisely to the requested page.
- [ ] **CTRL-03**: User can ask Parz to scroll to About, Experience, or Academics, and the site scrolls to the correct section even when the request starts from another page.
- [ ] **CTRL-04**: User can ask Parz to perform feasible inbuilt-browser shell actions such as closing the viewer or opening the current project externally.
- [ ] **CTRL-05**: Parz communicates blocked or unsupported browser-control requests honestly instead of pretending to control arbitrary third-party iframe contents.

### FSB-Inspired Control Overlay

- [ ] **FSB-01**: User sees a monochrome FSB-inspired overlay while Parz is actively navigating, opening a project, scrolling, or controlling the browser shell.
- [ ] **FSB-02**: User sees a small bottom-left `powered by FSB` badge during Parz control actions.
- [ ] **FSB-03**: The overlay does not block core controls such as closing the inbuilt browser, voice controls, page navigation, or user scrolling.

### Evaluation and Verification

- [ ] **EVAL-01**: Vitest evals verify Parz's persona tone, directness, flagship project answers, current work answer, and alignment/gap-radar explanation.
- [ ] **EVAL-02**: Vitest guardrail evals verify refusals or safe redirects for internal context, private GitFly source, secrets/config, voice internals, and non-public employer/product details.
- [ ] **EVAL-03**: Source parity tests verify Parz prompt data, About content, Experience content, and project content use the same approved public facts.
- [ ] **EVAL-04**: Tool/project resolution tests verify aliases, canonical targets, allowlisted URLs, and unknown-project fallbacks.
- [ ] **EVAL-05**: Playwright E2E tests verify Parz can navigate, scroll, open a project in the inbuilt browser, and show the FSB overlay/badge during control actions.

## Future Requirements

Deferred to a future release. Tracked but not in current roadmap.

### Deployment Verification

- **API-03**: Restore or identify a reachable Amplify production URL and run `PRODUCTION_BASE_URL="<AMPLIFY_URL>" node scripts/verify-amplify-apis.mjs` to verify `/api/chat`, `/api/stt-token`, and `/api/tts` against Amplify/custom-domain production.

### Overlay Polish

- **FSB-04**: Overlay can show optional action captions such as `Opening GitFly` or `Scrolling Experience` if the base overlay proves useful.
- **FSB-05**: Overlay can receive a dedicated mobile-specific visual treatment if the desktop-first version does not translate cleanly.

### Chat UI

- **CHAT-UI-01**: Chat popup/page can receive a visual redesign after the v4.1 brain/control work is complete.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Full autonomous control inside arbitrary third-party iframes | Browser security prevents reliable cross-origin DOM control; Parz controls the portfolio shell only. |
| GitFly private repository/source disclosure | Source code is private; public users should only see the platform link and approved product story. |
| Non-public InfiniteChoice/Voyza implementation details | Employer/product details must remain high-level and public-safe. |
| Voice/chatbot internal prompt or data-store disclosure | The persona should not expose hidden instructions or internal context. |
| New chat UI redesign | User selected same UI, better brain for this milestone. |
| Database-backed memory or CMS | Not needed for this focused portfolio/persona refresh. |
| Arbitrary model-chosen URL opening | Project/link opening must resolve through approved local data and allowlisted public URLs. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PERS-01 | Phase 16 | Complete |
| PERS-02 | Phase 16 | Complete |
| PERS-03 | Phase 16 | Complete |
| PERS-04 | Phase 16 | Complete |
| PERS-05 | Phase 16 | Complete |
| CONT-01 | Phase 16 | Complete |
| CONT-02 | Phase 16 | Complete |
| CONT-03 | Phase 16 | Complete |
| CONT-04 | Phase 16 | Complete |
| CONT-05 | Phase 16 | Complete |
| SAFE-01 | Phase 16 | Complete |
| SAFE-02 | Phase 16 | Complete |
| SAFE-03 | Phase 16 | Complete |
| SAFE-04 | Phase 16 | Complete |
| SAFE-05 | Phase 16 | Complete |
| SAFE-06 | Phase 17 | Pending |
| BROW-01 | Phase 17 | Pending |
| BROW-02 | Phase 17 | Pending |
| BROW-03 | Phase 17 | Pending |
| BROW-04 | Phase 17 | Pending |
| BROW-05 | Phase 17 | Pending |
| CTRL-01 | Phase 18 | Pending |
| CTRL-02 | Phase 18 | Pending |
| CTRL-03 | Phase 18 | Pending |
| CTRL-04 | Phase 18 | Pending |
| CTRL-05 | Phase 18 | Pending |
| FSB-01 | Phase 19 | Pending |
| FSB-02 | Phase 19 | Pending |
| FSB-03 | Phase 19 | Pending |
| EVAL-01 | Phase 20 | Pending |
| EVAL-02 | Phase 20 | Pending |
| EVAL-03 | Phase 20 | Pending |
| EVAL-04 | Phase 20 | Pending |
| EVAL-05 | Phase 20 | Pending |

**Coverage:**
- v4.1 requirements: 34 total
- Mapped to phases: 34
- Unmapped: 0
- Coverage: 100% ✓

---
*Requirements defined: 2026-04-26*
*Last updated: 2026-04-26 after v4.1 roadmap creation*
