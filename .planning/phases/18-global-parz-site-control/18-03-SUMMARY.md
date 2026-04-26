# Phase 18 Plan 03 Summary

## Completed

- Updated `/api/chat` to expose site-control tools for voice and text when `isVoice` or `enableSiteControl` is set.
- Added `closeBrowser`, `openCurrentProjectExternal`, and `unsupportedIframeControl` tools and instructions.
- Updated voice tool dispatch so `openProject` no longer navigates to portfolio first.
- Wired `VoiceSessionProvider` to global site-control callbacks.
- Enabled full chat page and popup to request site-control tools and dispatch returned tool parts through `useSiteControl`.

## Verification

- `npm run lint` passes with existing warnings.
- `npm run build` passes with existing warnings.

## Files Changed

- `src/app/api/chat/route.ts`
- `src/lib/voice-controller.ts`
- `src/providers/voice-session-provider.tsx`
- `src/app/chat/page.tsx`
- `src/components/chat-popup.tsx`
