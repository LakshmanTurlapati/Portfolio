# Requirements: Portfolio V2 -- v4.4 Website Audit Remediation

**Defined:** 2026-06-11
**Core Value:** A visually striking, interactive portfolio that showcases projects with rich detail, ambient animations, and an AI persona.

## v4.4 Requirements

Requirements for closing the quick website audit findings. The paid-API rate-limit redesign is intentionally excluded.

### Render Stability

- [x] **AUDIT-01**: User can open `/portfolio` on desktop and mobile without React hydration mismatch warnings caused by randomized project ordering.

### Dependency Health

- [x] **DEP-01**: Developer can run normal `npm ci` without needing `--legacy-peer-deps`.
- [x] **DEP-02**: Known package audit advisories are resolved where safe by updating direct dependencies and lockfile entries without changing application behavior.

### Link and Browser Safety

- [x] **LINK-01**: Visible project actions no longer expose known broken/private project links discovered by the audit.
- [x] **SEC-01**: Programmatic external browser openings use `noopener,noreferrer` to avoid opener access.

### UI and Lint Polish

- [x] **UX-01**: Small interactive controls flagged by the audit use practical clickable/tappable dimensions while preserving the existing visual direction.
- [x] **LINT-01**: Existing lint warnings from the audit are resolved.

### Verification

- [x] **VERIFY-01**: Lint, unit tests, production build, dependency audit, and Playwright e2e checks pass after the remediation.

## Future Requirements

Deferred to future release. Tracked but not in current roadmap.

### Production API Verification

- **API-03**: Owner can run the existing live Amplify/custom-domain API smoke script against a reachable `parzival.live` or Amplify production URL.

### Chat Motion Polish

- **CHAT-ANIM-01**: User experiences a more refined DART chat popup transition and send/message animation polish without changing the final visual design baseline.

### Paid API Quota Enforcement

- **API-RATE-01**: Replace in-memory paid-API rate limiting with durable/shared quota enforcement and trusted proxy-header handling.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Durable/shared paid-API rate-limit redesign | User explicitly asked to fix everything except rate limiting in this milestone. |
| Visual redesign of the portfolio | v4.4 is remediation, not a design direction change. |
| New portfolio projects or new app features | Scope is limited to audit findings and verification. |
| Live production custom-domain smoke test | API-03 remains infra-gated and unrelated to the local audit remediation. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUDIT-01 | Phase 30 | Complete |
| DEP-01 | Phase 30 | Complete |
| DEP-02 | Phase 30 | Complete |
| LINK-01 | Phase 30 | Complete |
| SEC-01 | Phase 30 | Complete |
| UX-01 | Phase 30 | Complete |
| LINT-01 | Phase 30 | Complete |
| VERIFY-01 | Phase 30 | Complete |

**Coverage:**
- v4.4 requirements: 8 total
- Mapped to phases: 8
- Unmapped: 0

---
*Requirements defined: 2026-06-11*
*Last updated: 2026-06-11 after Phase 30 completion*
