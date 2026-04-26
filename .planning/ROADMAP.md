# Roadmap: Portfolio v4.1 Parz Persona, Portfolio Context, and Site Control Refresh

## Overview

v4.1 refreshes Parz's public-facing brain, portfolio facts, project browsing path, and global site-control experience. The milestone starts from the shipped v4.0 voice/control foundation and continues phase numbering at Phase 16. The work first aligns public-safe facts and visible content, then replaces project-detail detours with direct inbuilt-browser opening, expands Parz's site controls, adds an FSB-inspired control overlay, and locks the behavior with Vitest and Playwright coverage.

## Milestones

- ✅ **v1.0 Migration** - Phases 1-4 (shipped / partially carried forward in historical roadmap)
- ✅ **v3 Portfolio Redesign** - Phases 5-11 (shipped)
- ✅ **v4.0 Voice Mode Production** - Phases 12-15 (shipped 2026-04-26)
- 🚧 **v4.1 Parz Persona, Portfolio Context, and Site Control Refresh** - Phases 16-20 (planned)

## Phases

- [x] **Phase 16: Public-Safe Persona and Content Refresh** - Parz, About, Experience, and flagship project content share the same approved public facts and guardrails. (completed 2026-04-26)
- [ ] **Phase 17: Direct Inbuilt Project Browser** - Manual project clicks resolve approved targets and open directly in the inbuilt browser without the right-side ProjectDetail path.
- [ ] **Phase 18: Global Parz Site Control** - Parz can navigate, scroll, open projects, and operate feasible viewer shell actions from any page.
- [ ] **Phase 19: FSB-Inspired Control Overlay** - Users see a monochrome control overlay and powered-by-FSB badge during real Parz control actions.
- [ ] **Phase 20: Verification and Regression Coverage** - Evals and E2E tests prove persona, safety, content parity, target resolution, and site-control behavior.

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
**Plans**: TBD
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
**Plans**: TBD
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
**Plans**: TBD
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

## Coverage

Every v4.1 requirement maps to exactly one phase.

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
16 → 17 → 18 → 19 → 20

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 16. Public-Safe Persona and Content Refresh | v4.1 | 3/3 | Complete    | 2026-04-26 |
| 17. Direct Inbuilt Project Browser | v4.1 | 0/TBD | Not started | - |
| 18. Global Parz Site Control | v4.1 | 0/TBD | Not started | - |
| 19. FSB-Inspired Control Overlay | v4.1 | 0/TBD | Not started | - |
| 20. Verification and Regression Coverage | v4.1 | 0/TBD | Not started | - |
