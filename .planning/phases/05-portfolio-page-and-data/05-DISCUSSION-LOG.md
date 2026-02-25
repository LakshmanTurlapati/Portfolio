# Phase 5: Portfolio Page and Data - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-23
**Phase:** 05-portfolio-page-and-data
**Areas discussed:** Visual polish, GitHub preview, Detail overlay content, Snowfall removal

---

## Visual Polish

| Option | Description | Selected |
|--------|-------------|----------|
| Pixel-perfect | Match the prototype exactly — rounded corners, 8px padding, image insets, hover bg transitions, card name text-shadow, link icon opacity | ✓ |
| Close enough | Match the feel but allow small deviations — use Tailwind defaults where close enough | |
| You decide | Claude matches as closely as possible using best judgment | |

**User's choice:** Pixel-perfect
**Notes:** Grid layout confirmed as 4/3/2/1 columns at prototype breakpoints.

---

## GitHub Preview

| Option | Description | Selected |
|--------|-------------|----------|
| Full preview | Fetch repo metadata, rendered README, contributors, languages bar — matches v3 prototype. Unauthenticated GitHub API. | ✓ |
| Lightweight card | Just repo name, description, stars, forks, language — one API call | |
| Open in new tab | Skip preview, just open github.com | |

**User's choice:** Full preview (Recommended)

---

## Detail Overlay Content

| Option | Description | Selected |
|--------|-------------|----------|
| 13 is enough | Projects without details show a simple fallback message | |
| Fill all 21 | Generate placeholder content for remaining 8 projects based on GitHub repos | ✓ |
| Minimal for missing | No overlay for missing projects, just open links directly | |

**User's choice:** Fill all 21

---

## Snowfall Removal

| Option | Description | Selected |
|--------|-------------|----------|
| DataGrid only | Keep DataGrid as sole portfolio background. Snowfall stays in codebase. | ✓ |
| Both effects | Layer snowfall on top of DataGrid | |
| Remove snowfall entirely | Delete snowfall component from codebase | |

**User's choice:** DataGrid only (Recommended)

## Claude's Discretion

- Animation durations/easing for card hover transitions
- DataGrid default config values
- Error handling for GitHub API rate limits

## Deferred Ideas

None
