# Phase 18 Plan 02 Summary

## Completed

- Replaced page-local about voice scroll registration with global `registerAboutScroller` from `useSiteControl`.
- Removed portfolio-page voice callback registration so global project opening no longer depends on visiting `/portfolio` first.
- Preserved manual portfolio card opening through direct `IframeViewer` rendering.

## Verification

- `npm run lint` passes with existing warnings.
- `npm run build` passes with existing warnings.

## Files Changed

- `src/app/about/page.tsx`
- `src/app/portfolio/page.tsx`
