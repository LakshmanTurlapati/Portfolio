# Phase 18 Plan 01 Summary

## Completed

- Added `src/providers/site-control-provider.tsx` with global navigation, approved project opening, section scroll delegation, browser close, external-open, and unsupported iframe-control limitation handling.
- Mounted `SiteControlProvider` in `src/app/layout.tsx` around route content and persistent voice UI.
- Global project opening now uses `resolveProject` and `getProjectBrowserTarget` before rendering `IframeViewer`.

## Verification

- `npm run lint` passes with existing warnings.
- `npm run build` passes with existing warnings.

## Files Changed

- `src/providers/site-control-provider.tsx`
- `src/app/layout.tsx`
