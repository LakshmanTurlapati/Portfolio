# Phase 4: Page Transitions and Deployment - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning
**Mode:** Auto-generated (autonomous mode)

<domain>
## Phase Boundary

Implement circular reveal page transitions on all navigation and deploy the complete application to AWS Amplify. The circular reveal must originate from the clicked element's position and work for both forward and backward navigation.

</domain>

<decisions>
## Implementation Decisions

### Circular Reveal Transitions
- CSS clip-path approach: fixed-position overlay div with `clip-path: circle()` animation
- Transition originates from clicked element's position (capture via getBoundingClientRect)
- Use GSAP for animating the clip-path circle radius from 0 to viewport diagonal
- Must work with Next.js App Router navigation (intercept Link clicks)
- Browser back button should trigger reverse reveal (or standard transition as fallback)
- All navigation points: navbar links, portfolio button, back buttons on content pages

### AWS Amplify Deployment
- Configure amplify.yml build spec for Next.js 15
- Environment variables: XAI_API_KEY must be accessible to API routes at runtime
- Write env vars to .env.production in amplify.yml build phase (Amplify Lambda workaround)
- Production domain configuration

### Claude's Discretion
- Transition duration and easing curve
- Fallback behavior for browsers without clip-path support
- Amplify-specific Next.js configuration details
- Whether to use experimental View Transitions API as enhancement

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Flutter `lib/circular_reveal_page_route.dart` -- reference for reveal animation behavior
- GSAP already installed (Phase 1)
- All pages complete and navigable (Phases 1-3)

### Established Patterns
- Navigation via Next.js Link components in navbar
- Back buttons on portfolio/about/chat pages
- App Router file-based routing

### Integration Points
- Wrap/intercept navigation in all navbar link clicks
- Wrap/intercept back button navigation on content pages
- TransitionProvider at layout level to manage transition state

</code_context>

<specifics>
## Specific Ideas

- Read Flutter circular_reveal_page_route.dart for exact animation curve and duration
- Transition overlay should be same color as destination page background
- Consider preloading destination page content during transition

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope.

</deferred>
