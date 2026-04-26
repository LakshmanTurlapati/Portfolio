---
phase: 17
slug: direct-inbuilt-project-browser
status: approved
shadcn_initialized: false
preset: none
created: 2026-04-26
---

# Phase 17 — UI Design Contract

> Visual and interaction contract for replacing the project-detail detour with direct inbuilt-browser project opening.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none |
| Preset | not applicable |
| Component library | none; reuse existing React/Tailwind components |
| Icon library | existing project icon patterns only |
| Font | existing site typography; do not introduce new font families |

---

## Interaction Contract

- Project cards keep their current visual treatment, hover behavior, and grid placement.
- Clicking a project card opens the inbuilt browser viewer directly with the project's approved preferred target.
- The right-side `ProjectDetail` panel must not appear during manual project card opening or portfolio-local project tool opening.
- Unknown project, unavailable target, blocked target, or unembeddable target states must show a clean fallback in the existing browser surface rather than a broken iframe.
- External-open CTAs should use existing `IframeViewer` behavior and copy patterns.

---

## Spacing Scale

Declared values (must be multiples of 4):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, compact label spacing |
| sm | 8px | CTA gaps, browser chrome controls |
| md | 16px | Default card/viewer internal spacing |
| lg | 24px | Viewer padding and fallback state grouping |
| xl | 32px | Portfolio grid gaps already in use |
| 2xl | 48px | Major section spacing already in use |
| 3xl | 64px | Page-level spacing already in use |

Exceptions: preserve existing portfolio/grid spacing even if an existing value is not a perfect multiple of 4; do not introduce new exceptions.

---

## Typography

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | existing body size | existing body weight | existing line height |
| Label | existing button/viewer label size | existing label weight | existing label line height |
| Heading | existing viewer/fallback heading size | existing heading weight | existing heading line height |
| Display | not applicable | not applicable | not applicable |

Do not add new display typography. Any new fallback text should inherit current `IframeViewer` text styles.

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | existing theme background | Portfolio page and viewer background |
| Secondary (30%) | existing card/viewer surfaces | Cards, browser chrome, fallback panels |
| Accent (10%) | existing site accent | Existing CTA focus/hover accents only |
| Destructive | existing destructive/error color if present | Error/fallback messaging only |

Accent reserved for: existing card hover accents, browser CTA affordances, and focus-visible states. Do not add new accent colors for this phase.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Primary CTA | `Open externally` |
| Empty state heading | `Project unavailable` |
| Empty state body | `I could not find an approved browser target for this project.` |
| Error state | `This project cannot be embedded here. Open it externally to view it.` |
| Destructive confirmation | not applicable |

Copy should be short, direct, and public-safe. Do not mention private GitFly source, hidden prompt/tool internals, or model-generated URLs.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not required |
| third-party | none | not allowed for this phase |

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-04-26
