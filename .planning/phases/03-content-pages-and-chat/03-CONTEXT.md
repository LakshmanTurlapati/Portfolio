# Phase 3: Content Pages and Chat - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning
**Mode:** Auto-generated (autonomous mode, user requested fast execution)

<domain>
## Phase Boundary

Build the Portfolio page (masonry grid of projects), About page (bio, experience, education with scrollable sections), and Chat page (xAI Grok AI chat with streaming responses via Next.js API route). All content must match the Flutter version. Chat API key must be server-side only.

</domain>

<decisions>
## Implementation Decisions

### Portfolio Page
- Masonry/staggered grid layout using CSS columns or grid -- match Flutter's StaggeredGridView appearance
- Project data hardcoded in component (matching Flutter's list of maps pattern)
- Project cards show image, name, and external links
- Reuse existing assets from Flutter's assets/ directory

### About Page
- Sections: Bio, Experience (timeline/cards), Education
- Scrollable section navigation (anchor links or intersection observer)
- Content hardcoded matching Flutter version exactly
- Single responsive component (not separate mobile/desktop files)

### Chat System
- Next.js API route at /api/chat for server-side xAI Grok communication
- Vercel AI SDK (@ai-sdk/xai) for streaming responses
- API key via environment variable (GROK_API_KEY), never in client bundle
- Conversation history maintained in React state within session
- Auto-detect and linkify URLs in chat messages
- User-friendly error messages matching Flutter's approach

### Claude's Discretion
- Grid column count and card sizing for portfolio
- Experience timeline visual design details
- Chat UI layout specifics (message bubbles, input area)
- Scroll behavior and section navigation implementation

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Flutter `lib/portfolio.dart` and `lib/mobile_portfolio.dart` -- project data and grid layout
- Flutter `lib/about_page.dart` and `lib/mobile_about_page.dart` -- section content and layout
- Flutter `lib/chat.dart` and `lib/chat_mobile.dart` -- chat UI and API service
- Flutter `lib/env.dart` -- API key reference (will be moved to env var)
- Flutter `assets/` -- project images to copy to Next.js public/
- Phase 1 components -- navbar, theme, layout already working

### Established Patterns
- kebab-case.tsx component files
- CSS custom properties for theme colors
- Responsive via Tailwind sm: breakpoint at 600px
- next-themes for dark/light mode

### Integration Points
- Replace placeholder pages at /portfolio, /about, /chat with real content
- API route at src/app/api/chat/route.ts
- Assets in public/ directory

</code_context>

<specifics>
## Specific Ideas

- Copy Flutter project images to public/assets/
- Extract exact project data from Flutter portfolio.dart
- Extract exact experience/education data from Flutter about_page.dart
- Use Vercel AI SDK useChat hook for chat client-side

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope.

</deferred>
