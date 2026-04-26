# Phase 18: Global Parz Site Control - Pattern Map

## Provider Pattern

- Analog: `src/providers/voice-session-provider.tsx`
- Pattern: client provider with `createContext`, exported hook, stable callbacks, and layout-level wrapping.
- Use for: `SiteControlProvider` and `useSiteControl`.

## Global Rendering Pattern

- Analog: `src/app/layout.tsx`
- Pattern: root provider stack renders persistent global UI after `{children}` (`VoiceOverlay`, `VoiceGlow`).
- Use for: rendering a global `IframeViewer` from inside the site-control provider so all routes can open approved projects.

## Safe Project Resolution Pattern

- Analog: `src/data/projects.ts`
- Pattern: `resolveProject(input)` followed by `getProjectBrowserTarget(project)` and `isApprovedProjectUrl(url)`.
- Use for: all global project openings. Do not accept raw model URLs.

## Voice Tool Pattern

- Analog: `src/lib/voice-controller.ts`
- Pattern: collect tool calls from the AI SDK stream, call `dispatchToolCall`, emit `VoiceBus` executing/success/error states.
- Use for: direct global `openProject`, `scrollTo`, `closeBrowser`, `openCurrentProjectExternal`, and limitation actions.

## About Scroll Pattern

- Analog: `src/app/about/page.tsx`
- Pattern: scroll page-local refs with `scrollIntoView({ behavior: 'smooth' })` and map aliases to `SectionId`.
- Use for: registering a global about scroller that can be called after navigation.

## Text Chat Pattern

- Analogs: `src/app/chat/page.tsx`, `src/components/chat-popup.tsx`
- Pattern: `useChat` renders `message.parts`; duplicated full-page and popup UI should be edited minimally.
- Use for: enabling site-control tools and dispatching tool result parts without redesigning chat UI.
