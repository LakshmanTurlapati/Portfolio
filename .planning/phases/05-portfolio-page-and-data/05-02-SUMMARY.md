---
phase: 05-portfolio-page-and-data
plan: 02
subsystem: portfolio-ui
tags: [typography, visual-polish, fonts, hover-states, css]
dependency_graph:
  requires: []
  provides: [instrument-serif-font, project-detail-polish, card-hover-brightening]
  affects: [src/app/layout.tsx, src/app/globals.css, src/components/project-detail.tsx, src/components/portfolio-card.tsx]
tech_stack:
  added: [Instrument_Serif (next/font/google)]
  patterns: [CSS custom property font variable, pseudo-element dash bullets, CSS grid auto-fit]
key_files:
  modified:
    - src/app/layout.tsx
    - src/app/globals.css
    - src/components/project-detail.tsx
    - src/components/portfolio-card.tsx
decisions:
  - Used font-[family-name:var(--font-instrument-serif)] Tailwind arbitrary value pattern for custom font application
  - Used inline style fontFamily for monospace chips/tags to avoid Tailwind purge issues with dynamic font stacks
  - isHovered state in PortfolioCard is separate from DataGrid hover logic — both fire together on onEnter/onLeave
metrics:
  duration: ~4 minutes
  completed: 2026-04-24T00:51:26Z
  tasks_completed: 2
  files_modified: 4
---

# Phase 5 Plan 02: Project Detail Visual Polish Summary

**One-liner:** Pixel-perfect audit of project detail overlay applying Instrument Serif typography, monospace metadata, CSS grid stats, dash-bullet highlights, and card hover background brightening to match the v3 prototype exactly.

## What Was Built

### Task 1: Instrument Serif font + project-detail.tsx polish

**layout.tsx:** Added `Instrument_Serif` import from `next/font/google` with weight 400, normal+italic styles, `--font-instrument-serif` CSS variable. Applied both `lato.variable` and `instrumentSerif.variable` to the `<html>` element.

**globals.css:** Added `.pd-highlights-list` and `.pd-highlights-list li::before` CSS rules for dash-style bullets — a horizontal 10px line via pseudo-element at `top: 10px`, matching the prototype's non-disc bullet style. Cannot be done with Tailwind alone.

**project-detail.tsx** — all changes are visual/styling only, no logic or props modified:
- h1 title: `font-serif` → `font-[family-name:var(--font-instrument-serif)]`
- Overview paragraph: `text-base leading-relaxed opacity-80` → `text-[22px] leading-[1.45] opacity-[0.92] max-w-[62ch] font-[family-name:var(--font-instrument-serif)]`
- Year/role chips: `font-mono px-2.5 py-1` → inline `fontFamily: JetBrains Mono`, `px-[10px] py-[5px]`
- Stats section: `flex gap-8 flex-wrap` → `grid gap-4` with `gridTemplateColumns: repeat(auto-fit, minmax(140px, 1fr))` and border-top/bottom separators
- Stat values: `text-2xl font-bold tracking-tight` → `text-[28px] leading-none tracking-[-0.01em] mb-1.5 font-[family-name:var(--font-instrument-serif)] font-normal`
- Stat labels: `text-xs tracking-[0.08em] opacity-50` → `text-[10px] tracking-[0.12em] opacity-55` with inline monospace fontFamily
- Stack tags: `text-xs px-3 py-1.5 rounded-full` → `text-[11px] px-[10px] py-1 rounded-[6px]` with inline monospace and opacity 0.82
- Section h3 headings: `text-sm font-bold tracking-[0.06em] opacity-60` → `text-[11px] font-medium tracking-[0.14em] opacity-55 mb-[14px]` with inline monospace
- Highlights ul: `list-disc pl-5 space-y-2` → `pd-highlights-list` (CSS class with dash pseudo-element)
- Highlights li: removed className (handled by CSS)
- Section body paragraphs: `text-sm leading-relaxed opacity-80` → `text-[15px] leading-[1.65] opacity-[0.88]`
- Cover image div: added `mt-4` for 16px top margin
- Body wrapper: added `pb-10` for 40px bottom padding
- Footer: replaced `py-8` with inline `paddingTop: 24px, paddingBottom: 48px`

### Task 2: Portfolio card hover background brightening

**portfolio-card.tsx:**
- Added `useState` to import alongside `useRef`
- Added `const [isHovered, setIsHovered] = useState(false)`
- `onEnter` calls `setIsHovered(true)` before existing DataGrid logic
- `onLeave` calls `setIsHovered(false)` before existing DataGrid logic
- Card div background: static `rgba(*,0.03)` → conditional `rgba(*,0.05)` when hovered, `rgba(*,0.03)` when not
- Added `transition: 'background 0.3s'` to card div style

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all visual elements are fully wired. No placeholder text or empty data sources introduced.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes introduced. The Google Fonts CDN dependency is self-hosted at build time by Next.js font optimization (T-05-05, accepted in threat model).

## Self-Check: PASSED

- src/app/layout.tsx: modified, Instrument_Serif import and variable confirmed
- src/app/globals.css: modified, .pd-highlights-list rules confirmed
- src/components/project-detail.tsx: created (new untracked file, now committed)
- src/components/portfolio-card.tsx: modified, isHovered state confirmed
- Commit 01c76d7: Task 1 — feat(05-02): add Instrument Serif font and polish project detail overlay
- Commit aa545d5: Task 2 — feat(05-02): add hover background brightening to portfolio card
- TypeScript: 0 errors (npx tsc --noEmit)
