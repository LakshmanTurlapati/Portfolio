---
status: complete
phase: 30
plan: 01
completed: 2026-06-11
---

# Summary: Website Audit Remediation

## Completed

- Replaced random portfolio ordering with deterministic seeded ordering to prevent SSR/client hydration mismatch.
- Replaced random dot-matrix render values with deterministic values.
- Updated dependency graph:
  - `next` / `eslint-config-next`: 15.5.19
  - `react` / `react-dom`: 19.1.2
  - `mermaid`: 11.15.0
  - transitive audit fixes for `ws` and `brace-expansion`
- Added shared `openExternalUrl()` helper and hardened programmatic external opens with `noopener,noreferrer`.
- Removed known broken/private visible links:
  - Blockchain GitHub 404
  - unshared/private Figma design actions
  - unreachable Revv Digital experience URL
- Enlarged small desktop/mobile interaction targets identified by the audit.
- Resolved lint warnings in `particle-background`, `use-canvas`, and `portfolio-card`.

## Verification

- `npm ci` — pass
- `npm run lint` — pass
- `npm test` — pass, 95 tests
- `npm run build` — pass
- `npm audit --audit-level=moderate` — pass, 0 vulnerabilities
- `npm run test:e2e` — pass, 26 tests
- Rendered smoke check — pass:
  - no page errors on sampled desktop/mobile routes
  - no horizontal overflow on sampled desktop/mobile routes
  - no sub-32px interactive targets in sampled controls

## Deferred

- API-RATE-01 remains future work by explicit user request.
- Claude and LinkedIn still block scripted unauthenticated link checks; user-facing URLs remain intentionally visible.
