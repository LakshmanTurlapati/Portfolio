# Roadmap: Portfolio V2 — Next.js Migration

## Milestones

- [x] **v1.0 Migration** — Phases 1-4 (shipped, partial — see `milestones/v3-ROADMAP.md` for the merged carry-forward)
- [x] **v3 Portfolio Redesign** — Phases 5-11 (shipped 2026-04-24, see `milestones/v3-ROADMAP.md`)
- [x] **v4.0 Voice Mode Production** — Phases 12-15 (shipped 2026-04-26, see `milestones/v4.0-ROADMAP.md`)
- [x] **v4.1 Parz Persona, Portfolio Context, and Site Control Refresh** — Phases 16-24 (shipped 2026-04-26, see `milestones/v4.1-ROADMAP.md`)
- [x] **v4.2 Carry-forward Polish & Hardening** — Phases 25-28 (shipped 2026-04-27, see `milestones/v4.2-ROADMAP.md`)
- [x] **v4.3 Legacy V2 Chat-Only Boundary** — Phase 29 (completed 2026-04-29)
- [x] **v4.4 Website Audit Remediation** — Phase 30 (completed 2026-06-11)

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

<details>
<summary>v4.2 Carry-forward Polish & Hardening (Phases 25-28) — SHIPPED 2026-04-27</summary>

- [x] Phase 25: Voice Wave 2 Hardening (5/5 plans) — completed 2026-04-26
- [x] Phase 26: Mobile UX Pass (3/3 plans) — completed 2026-04-26
- [x] Phase 27: FSB Overlay Polish (3/3 plans) — completed 2026-04-27
- [x] Phase 28: Chat UI Redesign (3/3 plans) — completed 2026-04-27

Full archive: [`milestones/v4.2-ROADMAP.md`](milestones/v4.2-ROADMAP.md)

</details>

## Phase Details

### Phase 30: Website Audit Remediation

**Status:** Complete

**Goal:** Fix the quick-audit findings except the explicitly deferred paid-API rate-limit redesign.

**Requirements:** AUDIT-01, DEP-01, DEP-02, LINK-01, SEC-01, UX-01, LINT-01, VERIFY-01

**Plans:** 1/1 plans complete

Plans:
- [x] 30-01-PLAN.md -- Hydration, dependency, link, browser-safety, tap-target, lint, and verification remediation

**Scope:**

- Make portfolio project ordering deterministic across SSR and hydration.
- Update direct package versions and lockfile so normal dependency installation works and known audit advisories are cleared where safe.
- Harden programmatic external link opens with `noopener,noreferrer`.
- Repair or remove known broken/private visible project links.
- Resize small controls flagged by the audit without changing the portfolio's visual direction.
- Resolve lint warnings and run the full verification matrix.

**Success criteria:**

1. `/portfolio` loads on desktop and mobile without hydration mismatch page errors.
2. `npm ci` succeeds without legacy peer dependency flags.
3. `npm audit --audit-level=moderate` reports no remaining actionable advisories in the installed graph.
4. Programmatic `window.open` calls use `noopener,noreferrer`.
5. Known broken project links are no longer exposed as visible project actions.
6. Desktop/mobile sampled controls meet practical clickable/tappable dimensions.
7. `npm run lint`, `npm test`, `npm run build`, and `npm run test:e2e` pass.

### Phase 29: Legacy V2 Chat-Only Boundary

**Status:** Complete

**Goal:** Make Legacy V2 text chat answer normally while preventing navigation, project-opening, theme, browser, tour, and other site-control tool execution; preserve those advanced features in voice mode.

**Requirements:** CHAT-01, CHAT-02, CHAT-03, CHAT-04, VOICE-01, TEST-01

**Plans:** 1/1 plans complete

Plans:
- [x] 29-01-PLAN.md -- Voice-only site-control boundary for `/api/chat`, Legacy V2 text clients, and regression coverage

**Scope:**

- Separate text chat from voice/tool-capable chat at the `/api/chat` prompt and tool-routing boundary.
- Remove site-control enablement and client-side tool execution from the Legacy V2 chat popup and full `/chat` page.
- Add concise text-chat guidance for navigation/site-control requests: use voice mode for advanced features.
- Preserve existing voice-mode tools and voice-to-text handoff behavior.
- Add regression coverage for the server and client boundary.

**Success criteria:**

1. Text chat still answers ordinary persona, project, portfolio, and broad-topic questions conversationally.
2. Navigation, project opening, scrolling, theme toggling, tours, browser control, and external-open requests in text chat produce a helpful "use voice mode for advanced features" style response instead of tool execution.
3. Legacy V2 chat popup and `/chat` no longer send `enableSiteControl` and no longer call `SiteControlProvider` from assistant tool parts.
4. Voice mode still exposes and executes the existing site-control tools.
5. Automated tests cover text-chat request bodies, `/api/chat` tool selection, client no-tool execution, and voice tool preservation.

## Progress

**Execution Order:**
Phases execute in numeric order: 30

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
| 27. FSB Overlay Polish                      | v4.2 | 3/3 | Complete    | 2026-04-27 |
| 28. Chat UI Redesign                        | v4.2 | 3/3 | Complete    | 2026-04-27 |
| 29. Legacy V2 Chat-Only Boundary            | v4.3 | 1/1 | Complete    | 2026-04-29 |
| 30. Website Audit Remediation               | v4.4 | 1/1 | Complete    | 2026-06-11 |

## Requirement Coverage

| Requirement | Phase | Status |
|-------------|-------|--------|
| CHAT-01 | Phase 29 | Complete |
| CHAT-02 | Phase 29 | Complete |
| CHAT-03 | Phase 29 | Complete |
| CHAT-04 | Phase 29 | Complete |
| VOICE-01 | Phase 29 | Complete |
| TEST-01 | Phase 29 | Complete |
| AUDIT-01 | Phase 30 | Complete |
| DEP-01 | Phase 30 | Complete |
| DEP-02 | Phase 30 | Complete |
| LINK-01 | Phase 30 | Complete |
| SEC-01 | Phase 30 | Complete |
| UX-01 | Phase 30 | Complete |
| LINT-01 | Phase 30 | Complete |
| VERIFY-01 | Phase 30 | Complete |

**Coverage:** 8/8 active v4.4 requirements mapped.
