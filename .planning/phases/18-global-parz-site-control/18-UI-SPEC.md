---
phase: 18
slug: global-parz-site-control
status: approved
shadcn_initialized: false
preset: none
created: 2026-04-26
---

# Phase 18 — UI Design Contract

> Visual and interaction contract for frontend control plumbing. Generated for autonomous UI phase and verified against the current design system.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none |
| Preset | not applicable |
| Component library | none |
| Icon library | react-icons/fa6 only where existing controls already use it |
| Font | Lato for UI/body; Instrument Serif only if existing page typography already uses it |

---

## Spacing Scale

Declared values (must be multiples of 4):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, compact chrome controls |
| sm | 8px | Button/icon spacing, close/external shell controls |
| md | 16px | Viewer inset on mobile, panel padding, event target gutters |
| lg | 24px | Desktop control grouping and fallback message padding |
| xl | 32px | Desktop viewer inset and page-level control spacing |
| 2xl | 48px | Existing about-page nav/back control dimensions |
| 3xl | 64px | Reserved for page sections; avoid new usage in Phase 18 |

Exceptions: preserve existing `IframeViewer` `inset-4 sm:inset-8`, 48px about back button, and existing page-specific spacing.

---

## Typography

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 16px | 400 | 1.625 |
| Label | 14px | 500 | 1.4 |
| Shell chrome | 14px | 500 | 1.4 |
| Fallback heading | 20px | 700 | 1.3 |
| Status/error helper | 12px | 400 | 1.4 |

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `var(--color-bg)` / `var(--color-page-inverted-bg)` | Current page background; do not add new phase-specific background colors |
| Secondary (30%) | `#fafaf7` light viewer surface, `#1a1a1c` dark viewer surface | Existing inbuilt-browser surface and fallback panels |
| Accent (10%) | `var(--color-text)` / `var(--color-page-inverted-text)` | Text, icons, approved action buttons, section target emphasis |
| Destructive | none | Phase 18 has no destructive actions |

Accent reserved for: browser chrome labels, close/external icon buttons, fallback CTA, section-focus target text. Do not introduce a new color accent before Phase 19.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Project opening acknowledgement | `Opening {project}.` |
| Navigation acknowledgement | `Heading to {page}.` |
| Section scroll acknowledgement | `Taking you to {section}.` |
| Close browser acknowledgement | `Closing the browser view.` |
| External open acknowledgement | `Opening the current project in a new tab.` |
| No active browser state | `There is no project browser open right now.` |
| Unknown project state | `I couldn't find an approved project target for that.` |
| Unsupported iframe control | `I can control the portfolio shell, but I can't operate arbitrary controls inside a third-party iframe.` |
| Error state | `That control action didn't complete. Try the page control manually.` |
| Destructive confirmation | Not applicable |

---

## Interaction Contract

| Interaction | Contract |
|-------------|----------|
| `openProject` from any page | Resolve alias/slug/name through local project data, open `IframeViewer` globally, and leave the current page route unchanged unless navigation is explicitly requested. |
| `navigate` | Route only to home, portfolio, or about using existing reveal transition where available. |
| `scrollTo` | Navigate to about if needed, then scroll the about page's internal scroll container to `about`, `experience`, or `academics`. |
| `closeBrowser` | Close the global inbuilt browser if open; otherwise return the no-active-browser copy. |
| `openCurrentProjectExternal` | Open the currently tracked approved browser target in a new tab; otherwise return the no-active-browser copy. |
| Unsupported iframe control | Do not attempt cross-origin iframe DOM actions; return the limitation copy. |

---

## Accessibility And Responsiveness

- Preserve `Escape` to close the inbuilt browser.
- Browser controls must remain pointer-safe and keyboard reachable.
- Do not block navbar, voice controls, page navigation, or user scrolling with Phase 18 plumbing.
- The command contract must behave the same below and above the 600px breakpoint.
- Section scroll must work with the about page's internal scroll container, not only `window.scrollTo`.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not required |
| third-party | none | not required |

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-04-26
