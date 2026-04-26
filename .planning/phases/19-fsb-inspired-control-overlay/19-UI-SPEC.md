---
phase: 19
slug: fsb-inspired-control-overlay
status: approved
shadcn_initialized: false
preset: none
created: 2026-04-26
---

# Phase 19 — UI Design Contract

> Visual and interaction contract for the FSB-inspired Parz control overlay.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none |
| Preset | not applicable |
| Component library | none |
| Icon library | none required |
| Font | Existing Lato body font via `--font-lato`; no new font |

---

## Spacing Scale

Declared values (must be multiples of 4):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Micro gaps inside badge/corner details |
| sm | 8px | Badge internal vertical padding, scan/corner offsets |
| md | 16px | Badge horizontal padding, mobile safe-area spacing |
| lg | 24px | Desktop badge offset from viewport edges |
| xl | 32px | Corner/crosshair breathing room |
| 2xl | 48px | Large viewport overlay mark spacing |
| 3xl | 64px | Maximum decorative grid/corner spacing |

Exceptions: 1px hairline scan/grid/corner strokes are allowed for crisp monochrome overlay detail.

---

## Typography

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | inherited | inherited | inherited |
| Label | 10px desktop / 9px mobile | 700 | 1.2 |
| Heading | not used | not applicable | not applicable |
| Display | not used | not applicable | not applicable |

Badge label must use uppercase tracking (`0.14em` to `0.18em`) and remain compact. No visible heading, modal title, or action caption is part of Phase 19.

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | transparent | Overlay must preserve the underlying site |
| Secondary (30%) | `rgba(var(--fsb-overlay-rgb), 0.08)` to `0.16` | Scan/grid/corner/crosshair lines |
| Accent (10%) | `rgb(var(--fsb-overlay-rgb))` | `powered by FSB` badge text and strongest hairlines only |
| Destructive | not used | No destructive actions in this UI |

Accent reserved for: badge text, badge border, and strongest corner/crosshair strokes only.

Theme contract: dark mode uses white overlay RGB (`255,255,255`), light mode uses black overlay RGB (`0,0,0`). Do not introduce colored FSB branding in this phase.

---

## Visual Contract

- Render a fixed full-viewport overlay with `pointer-events-none`.
- Use monochrome scan/grid lines, corner marks, and a small crosshair/target motif to communicate observable AI control.
- Keep opacity ambient: visible on black, white, and inverted portfolio/about backgrounds without reading as a blocking modal.
- Render the bottom-left badge with exact copy `powered by FSB` while the overlay is active.
- Keep the overlay below `IframeViewer` controls and voice controls where necessary; it must never prevent closing the browser, using voice controls, using nav, or scrolling.
- Do not show action captions, logs, project names, or verbose status copy in Phase 19.

---

## Interaction Contract

- Trigger only from Parz site-control actions: `navigate`, `openProject`, `scrollTo`, `closeBrowser`, `openCurrentProjectExternal`, and unsupported iframe-control refusals.
- Do not trigger from manual user clicks, card opens, normal route changes, chat thinking, or voice listening by itself.
- Start immediately before the action runs.
- Remain visible for a short minimum duration so users can perceive it, then clear cleanly after success, error, or blocked results.
- Use the same overlay path for text chat and voice Parz actions by wrapping the shared `SiteControlProvider` methods.
- Respect `prefers-reduced-motion: reduce` by disabling or flattening animated scan movement while leaving static marks and badge visible.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Primary CTA | not applicable |
| Badge | powered by FSB |
| Screen-reader live status | Parz is controlling the site. |
| Empty state heading | not applicable |
| Empty state body | not applicable |
| Error state | not applicable; existing tool result copy handles errors |
| Destructive confirmation | not applicable |

Visible copy must be limited to the badge. Accessibility copy should be concise and not expose implementation internals.

---

## Responsive Contract

- Desktop and mobile use the same component and lifecycle.
- At widths below the existing 600px breakpoint, reduce decorative density and keep badge inside safe viewport padding.
- Badge remains bottom-left on all viewports unless it would collide with browser/voice controls; if collision occurs, prefer a small safe-area offset rather than moving to a new visual concept.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not required |
| third-party | none | not required |

No external registry components, packages, images, or third-party snippets should be added for this overlay.

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-04-26
