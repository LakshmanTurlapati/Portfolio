---
status: passed
phase: 18-global-parz-site-control
verified: 2026-04-26
---

# Phase 18 Verification

## Goal

Users can ask Parz to control portfolio navigation, section scrolling, project opening, and feasible inbuilt-browser shell actions from any current page.

## Automated Checks

- `npm run lint` passed with 7 existing warnings and 0 errors.
- `npm run build` passed with 7 existing warnings and no type errors.

## Requirement Coverage

| Requirement | Status | Evidence |
|-------------|--------|----------|
| CTRL-01 | passed | `SiteControlProvider.openProject` resolves local project records and opens global `IframeViewer`; voice no longer navigates to portfolio before `openProject`; text chat dispatches `openProject`. |
| CTRL-02 | passed | `SiteControlProvider.navigate` supports only `home`, `portfolio`, and `about`; voice and text dispatch `navigate`. |
| CTRL-03 | passed | `SiteControlProvider.scrollTo` navigates to `/about` if needed and delegates to `registerAboutScroller`; about page registers its internal scroller. |
| CTRL-04 | passed | `closeBrowser` and `openCurrentProjectExternal` are implemented in the provider, API tool schema, voice dispatch, and text chat dispatch. |
| CTRL-05 | passed | `unsupportedIframeControl` returns the locked limitation copy and is exposed through API, voice, and text dispatch. |

## Must-Haves

- Approved project aliases can open a global inbuilt browser from any route without navigating to portfolio: passed.
- Browser shell close and external-open actions operate only on the active approved browser target: passed.
- Unsupported third-party iframe control returns an honest limitation instead of mutating state: passed.
- About, Experience, and Academics scrolling is wired through the about page's internal scroll container: passed.
- Text and voice Parz use the same global control provider: passed.

## Residual Risks

- Live model tool-call selection still needs browser/UAT validation because Phase 20 owns full Playwright and eval coverage.
- Existing lint warnings remain outside Phase 18 scope.
