---
phase: 06-home-page-and-ambient-backgrounds
plan: "01"
subsystem: github-stats
tags: [api-route, github, scraping, live-data, isr]
dependency_graph:
  requires: []
  provides: [github-stats-api, github-stats-component-live]
  affects: [home-page]
tech_stack:
  added: []
  patterns: [next-isr-revalidate, server-side-scraping, client-fetch-with-fallback]
key_files:
  created:
    - src/app/api/github-stats/route.ts
    - src/components/github-stats.tsx
  modified: []
decisions:
  - "Use tooltip text for contribution counts (not data-level attribute which is 0-4 intensity only; data-count removed by GitHub ~2023)"
  - "ISR revalidate=3600 caps upstream GitHub requests to 3 per hour regardless of traffic"
  - "Current streak starts from yesterday if today has 0 contributions (Pitfall 2 from RESEARCH.md)"
  - "Label changed to 'Contributions (12 mo)' to accurately reflect the 12-month scraping window"
metrics:
  duration: "91 seconds"
  completed: "2026-04-24T01:27:45Z"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 0
---

# Phase 06 Plan 01: GitHub Stats Live Data Pipeline Summary

Live GitHub stats data pipeline: server-side scraping route with ISR caching + client component updated to fetch and display live contribution counts, streak, stars, and repos with hardcoded fallback.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create /api/github-stats route | 991c3a3 | src/app/api/github-stats/route.ts |
| 2 | Wire GitHubStats component to live data | 19960ec | src/components/github-stats.tsx |

## What Was Built

### Task 1: /api/github-stats API Route

`src/app/api/github-stats/route.ts` — Next.js App Router GET handler with:

- `export const revalidate = 3600` for ISR 1-hour cache (caps GitHub upstream calls)
- `Promise.all` of three parallel fetches: GitHub contributions HTML page, GitHub user REST API, GitHub repos REST API
- Tooltip-based contribution count extraction (regex on `<tool-tip>` elements, not `data-level`)
- Sorted day array built from `ContributionCalendar-day` td elements with data-date attributes
- Current streak computed walking backward from today (skips today if count=0 per pitfall)
- Longest streak computed in single pass over sorted days
- Total stars summed across all owned repos from repos API
- Full `try/catch` wrapping with FALLBACK constant returned on any error

### Task 2: GitHubStats Component — Live Data

`src/components/github-stats.tsx` changes:

- Added `useEffect` import alongside existing `useState`
- Replaced hardcoded `GITHUB_STATS` with `FALLBACK_STATS` as initial `useState` value
- Added `useEffect` that fetches `/api/github-stats` on mount, formats values (k-suffix for >=1000), and calls `setStats`
- All JSX references updated from `GITHUB_STATS.*` to `stats.*`
- Detail panel label updated: "Commits in 2026" → "Contributions (12 mo)"
- Catch block silently keeps fallback — pill always renders

## Deviations from Plan

None — plan executed exactly as written.

## Verification Results

All 9 checks passed:
1. Route file exists at `src/app/api/github-stats/route.ts`
2. `export const revalidate = 3600` present
3. TypeScript compiles without errors (`npx tsc --noEmit` clean)
4. `useState, useEffect` imported in github-stats.tsx
5. `fetch('/api/github-stats')` call present in useEffect
6. JSX references `stats.totalContrib` (not `GITHUB_STATS.totalContrib`)
7. No remaining `GITHUB_STATS` references in component
8. `FALLBACK_STATS` defined and used as initial state
9. Label reads "Contributions (12 mo)"

## Threat Surface Scan

No new security surface introduced beyond what the plan's threat model covers:
- T-06-02 mitigated: raw scraped HTML never forwarded to client; only computed numeric values returned
- T-06-03 mitigated: ISR revalidate=3600 limits upstream requests; try/catch falls back on rate-limit errors

## Self-Check: PASSED

- `src/app/api/github-stats/route.ts`: EXISTS
- `src/components/github-stats.tsx`: EXISTS
- Commit 991c3a3: FOUND (feat(06-01): create /api/github-stats route)
- Commit 19960ec: FOUND (feat(06-01): wire GitHubStats component to live data)
