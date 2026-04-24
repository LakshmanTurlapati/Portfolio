---
phase: 05-portfolio-page-and-data
plan: 01
subsystem: portfolio
tags: [github-preview, iframe-viewer, github-api, react, typescript]
dependency_graph:
  requires: []
  provides: [GithubPreview, IframeViewer-GitHub-routing]
  affects: [src/components/iframe-viewer.tsx]
tech_stack:
  added: []
  patterns: [fetch-in-useEffect, dangerouslySetInnerHTML-sanitized, inline-styles-dark-mode]
key_files:
  created:
    - src/components/github-preview.tsx
  modified:
    - src/components/iframe-viewer.tsx
decisions:
  - "Used inline styles (not CSS classes) since GithubPreview renders inside IframeViewer which has its own CSS scope; no globals.css additions needed"
  - "Responsive sidebar collapse implemented via inline <style> block targeting .ghx-responsive-grid at 768px breakpoint"
  - "Mermaid rendering intentionally omitted (out of scope per plan)"
  - "T-05-02 mitigated: rewriteRelativeUrls applied before dangerouslySetInnerHTML injection; external links get rel=noopener"
metrics:
  duration: ~8min
  completed: 2026-04-24T00:52:04Z
  tasks_completed: 2
  files_created: 1
  files_modified: 1
---

# Phase 5 Plan 01: GithubPreview Component and IframeViewer Routing Summary

**One-liner:** GitHub repo preview card with API-fetched metadata, rendered README HTML, contributor avatars, and language bar wired into IframeViewer to replace the generic blocked CTA for GitHub URLs.

## What Was Built

### Task 1: GithubPreview component (`src/components/github-preview.tsx`)

A `'use client'` React component that renders a GitHub-like repo card when a GitHub URL cannot be iframed.

**Data fetching (useEffect on parsed owner/repo):**
1. `GET https://api.github.com/repos/{owner}/{repo}` — repo metadata
2. Parallel: README (Accept: application/vnd.github.raw), contributors (per_page=8), languages
3. `POST https://api.github.com/markdown` — render README markdown to sanitized HTML
4. `rewriteRelativeUrls()` — rewrites relative img/a paths to raw.githubusercontent.com / github.com blob URLs; adds `target="_blank" rel="noopener"` to all external links

**Visual sections:**
- **Loading state**: spinner + "Loading owner/repo..." text
- **Error state**: FaGithub icon + error message + "Open on GitHub" button. Maps 403 → "GitHub API rate limit reached", 404 → "Repository not found"
- **Loaded state**:
  - Sticky header: folder icon + owner/repo breadcrumb (links to GitHub), visibility badge, fork/archived pills, Watch/Fork/Star buttons with counts
  - Subnav tabs: Code (active), Issues, Pull requests, Actions, Security, Insights — each opens correct GitHub URL in new tab
  - Main grid (1fr 296px, collapses to 1col at 768px): content column + sidebar
  - Content column: branch bar with branch name, "Updated X ago", green "Open on GitHub" button; README card with header and rendered HTML
  - Sidebar: About (description, homepage link, topics, license/watching/forks/stars list), Contributors avatar grid (up to 8), Languages bar with grayscale segments + percentage list

**Helpers:** `parseGithubUrl`, `formatNum`, `formatDate`, `rewriteRelativeUrls`

**Icons used from react-icons/fa6:** FaGithub, FaArrowUpRightFromSquare, FaCode, FaCodeBranch, FaCodeFork, FaCodePullRequest, FaPlay, FaShieldHalved, FaChartBar, FaCircleDot, FaAngleDown, FaClockRotateLeft, FaEye, FaStar, FaBook, FaLink, FaFolderOpen, FaFileLines

### Task 2: IframeViewer routing (`src/components/iframe-viewer.tsx`)

Added import of `GithubPreview` and updated the `unembeddable` branch:
- When `kind === 'github'` → renders `<GithubPreview url={url} isDark={isDark} />`
- All other unembeddable hosts → existing generic fallback CTA unchanged
- Figma embed and web iframe paths unchanged

## Commits

| Task | Hash | Message |
|------|------|---------|
| Task 1 | 480d5cb | feat(05-01): build GithubPreview component with GitHub API fetch and rich UI |
| Task 2 | a88a716 | feat(05-01): wire GithubPreview into IframeViewer for GitHub URLs |

## Deviations from Plan

None — plan executed exactly as written.

## Threat Mitigation Applied

**T-05-02 (Tampering via dangerouslySetInnerHTML):** Content originates from GitHub's own markdown rendering API which server-sanitizes the output. All relative URLs in README HTML are rewritten to absolute raw.githubusercontent.com / github.com blob paths before injection. All external `<a>` links receive `target="_blank" rel="noopener"` via `rewriteRelativeUrls`.

## Known Stubs

None — all data flows are wired to live GitHub API endpoints.

## Self-Check: PASSED

- FOUND: src/components/github-preview.tsx
- FOUND: src/components/iframe-viewer.tsx
- FOUND commit: 480d5cb
- FOUND commit: a88a716
- TypeScript: `npx tsc --noEmit` passes with no errors
