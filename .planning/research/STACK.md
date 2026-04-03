# Technology Stack

**Project:** Portfolio V2 -- Flutter-to-Next.js Migration
**Researched:** 2026-04-02

## Critical Constraint: AWS Amplify Limits Next.js Version

AWS Amplify Hosting officially supports Next.js versions 12 through 15 only. Next.js 16 is **not supported** (open GitHub issue #14600 on aws-amplify/amplify-js). Since deployment target is AWS Amplify, the project **must use Next.js 15.x**.

This is not a compromise -- Next.js 15 is production-stable, well-documented, and has all features needed for this project. Next.js 16's main additions (Cache Components, `use cache` directive, Turbopack as default) are not required for a portfolio site.

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Next.js | 15.5.x (latest 15.5.9) | Framework, routing, SSR, API routes | App Router provides server components, route handlers for API proxy, and the project requires AWS Amplify which caps at v15. | HIGH |
| React | 19.x | UI library | Bundled with Next.js 15. Server Components, Suspense, transitions. | HIGH |
| TypeScript | 5.x | Type system | Project constraint. Next.js 15 ships with TS support out of the box. | HIGH |
| Tailwind CSS | 4.2.x (latest 4.2.2) | Styling | Project constraint. CSS-first config in v4 (no tailwind.config.js needed). 5x faster builds, native CSS variables for design tokens. Use v4, not v3 -- it is stable and well-supported with Next.js 15. | HIGH |

### Animation

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| GSAP | 3.14.x (latest 3.14.2) | Page transitions, DOM animations, timelines | Best-in-class animation library. Now 100% free for commercial use (Webflow acquisition, April 2025). Handles circular reveal transitions via clip-path animation, stagger effects, and complex sequencing. Motion/Framer Motion cannot do canvas or clip-path transitions as cleanly. | HIGH |
| @gsap/react | 2.1.x (latest 2.1.2) | React integration for GSAP | Official `useGSAP()` hook -- drop-in replacement for useEffect that handles GSAP cleanup automatically. Required for React/Next.js integration. | HIGH |
| HTML5 Canvas API (native) | N/A | Particle systems, snow, fog, dot matrix, spotlight effects | The Flutter version uses custom canvas rendering for all background effects. These should be reimplemented as custom Canvas components using `requestAnimationFrame` -- no library needed. tsParticles adds 50KB+ of bundle for features you won't use. Custom canvas gives pixel-perfect control to match the Flutter version. | HIGH |

**Why NOT tsParticles/particles.js:** The Flutter app has bespoke particle physics (custom velocity, drift, opacity curves, boundary behavior). A generic particle library would require fighting its API to match the existing behavior. Direct Canvas API with requestAnimationFrame is simpler, lighter (~0KB dependency), and gives exact control.

**Why NOT Motion (Framer Motion):** Motion excels at declarative React component animation but is weaker for canvas-based effects and complex clip-path transitions. GSAP's timeline model is better suited for the circular reveal page transition and sequenced animations. GSAP is also framework-agnostic, so animation knowledge transfers beyond React.

### Theming

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| next-themes | 0.4.x (latest 0.4.6) | Dark/light mode toggle with system detection | De facto standard for Next.js theming. Zero-flash on load, system preference detection, syncs across tabs. Integrates cleanly with Tailwind CSS v4's dark mode via `selector` strategy. Two lines of setup code. | HIGH |

### AI Chat Integration

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| ai (Vercel AI SDK) | 6.x (latest 6.0.143) | Streaming chat interface, message management | Provides `useChat` hook (client) and `streamText` (server) -- handles SSE streaming, message state, loading states, error handling. Eliminates manual WebSocket/stream parsing. | HIGH |
| @ai-sdk/xai | 3.x (latest 3.0.74) | xAI Grok provider for AI SDK | Official xAI provider for Vercel AI SDK. Supports Grok models, streaming, and structured output. The Flutter version uses raw HTTP to the xAI API -- this replaces it with a proper SDK. Actively maintained (last published days ago). | HIGH |

**Architecture note:** The chat API key moves from frontend (`lib/env.dart` -- security vulnerability) to a Next.js Route Handler (`app/api/chat/route.ts`). The key is stored in environment variables, never sent to the client.

### Icons

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| react-icons | 5.6.x (latest 5.6.0) | Icon library | Includes Font Awesome 6 (2058 icons), Feather, and many other packs. Tree-shakeable -- only icons you import are bundled. Replaces both `font_awesome_flutter` and `cupertino_icons` from the Flutter stack. Single dependency instead of multiple. | HIGH |

### Fonts

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| next/font/google | Built into Next.js | Google Fonts (self-hosted) | Automatically downloads and self-hosts Google Fonts at build time. Zero layout shift, no external requests (GDPR-compliant), no `google_fonts` package needed. Replaces the Flutter `google_fonts` dependency. | HIGH |

### Grid Layout

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| CSS Grid + Tailwind | Built-in | Staggered grid for portfolio page | Tailwind's grid utilities plus CSS `masonry` (experimental) or a custom column-based approach replaces `flutter_staggered_grid_view`. For guaranteed cross-browser support, use a simple column-based CSS approach rather than the experimental masonry spec. | MEDIUM |

### Deployment

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| AWS Amplify Hosting | Gen 2 | Hosting and CI/CD | Project constraint. Supports Next.js 15 SSR, API routes, middleware. Auto-deploys from Git. Node.js 20+ required (18 deprecated Sept 2025). | HIGH |

---

## Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| clsx | 2.x | Conditional class name joining | When building components with conditional Tailwind classes |
| tailwind-merge | 3.x | Merge conflicting Tailwind classes | When component props can override default styles |

These two are lightweight utilities (<2KB combined) that dramatically improve Tailwind DX. Install them together.

---

## What NOT to Use

| Technology | Why Not |
|------------|---------|
| Next.js 16 | AWS Amplify does not support it. Open issue, no timeline for support. |
| Framer Motion / Motion | Weaker canvas support, cannot do clip-path circular reveals as cleanly as GSAP. Would need GSAP anyway for the hard parts, creating two animation systems. |
| tsParticles | Overkill for custom particle effects. Adds significant bundle size. Custom canvas gives exact Flutter behavior replication. |
| Three.js / React Three Fiber | Massive overkill for 2D particle effects. The Flutter version uses 2D canvas -- no 3D needed. |
| Tailwind CSS v3 | v4 is stable, faster, and the default going forward. No reason to use v3 for a new project. |
| shadcn/ui | This is a portfolio site with bespoke visual design, not a dashboard. shadcn components would need extensive customization to match the Flutter design -- easier to build from scratch with Tailwind. |
| CSS Modules | Tailwind is the styling system. CSS Modules would create a split approach. |
| Styled Components / Emotion | CSS-in-JS has fallen out of favor with React Server Components. Tailwind is the standard. |
| Zustand / Redux | No complex client state management needed. React Context + useState handles theme toggle and chat state. The AI SDK manages chat state internally. |

---

## Installation

```bash
# Core
npx create-next-app@15 portfolio-v2 --typescript --tailwind --app --src-dir

# Animation
npm install gsap @gsap/react

# Theming
npm install next-themes

# AI Chat
npm install ai @ai-sdk/xai

# Icons
npm install react-icons

# DX utilities
npm install clsx tailwind-merge
```

**Dev dependencies (auto-included by create-next-app):**
- typescript
- @types/node
- @types/react
- @types/react-dom
- tailwindcss
- eslint
- eslint-config-next

---

## Version Pinning Strategy

Pin **major.minor** in package.json, allow patch updates:

```json
{
  "next": "^15.5.0",
  "react": "^19.0.0",
  "gsap": "^3.14.0",
  "@gsap/react": "^2.1.0",
  "next-themes": "^0.4.0",
  "ai": "^6.0.0",
  "@ai-sdk/xai": "^3.0.0",
  "react-icons": "^5.6.0",
  "clsx": "^2.0.0",
  "tailwind-merge": "^3.0.0"
}
```

Use a lockfile (`package-lock.json`) and commit it. Amplify uses the lockfile for deterministic builds.

---

## Flutter-to-Next.js Migration Map

| Flutter Dependency | Next.js Replacement | Notes |
|--------------------|---------------------|-------|
| Flutter framework | Next.js 15 + React 19 | App Router, server/client components |
| Dart language | TypeScript | Similar type safety, different syntax |
| Material Design 3 | Tailwind CSS v4 | Utility-first instead of component library |
| Custom Canvas (dart:ui) | HTML5 Canvas API | Same paradigm, different API surface |
| google_fonts | next/font/google | Built-in, self-hosted, zero CLS |
| font_awesome_flutter | react-icons (fa6) | Tree-shakeable, same icon set |
| flutter_staggered_grid_view | CSS Grid + custom columns | Native CSS, no dependency |
| http package | Vercel AI SDK | Structured SDK instead of raw HTTP |
| url_launcher | HTML anchor tags / window.open | Native web, no library needed |
| flutter_linkify | Native HTML auto-linking or regex | Trivial in web context |
| cached_network_image | next/image | Built-in image optimization |
| cupertino_icons | react-icons | Included in react-icons bundle |
| lib/env.dart (API key) | .env.local + Route Handler | Server-side only, never exposed to client |

---

## Sources

- [Next.js 15 Official Docs](https://nextjs.org/docs/app/guides/upgrading/version-15) -- HIGH confidence
- [AWS Amplify Next.js Support](https://docs.aws.amazon.com/amplify/latest/userguide/ssr-amplify-support.html) -- HIGH confidence, confirms v12-15 only
- [AWS Amplify Next.js 16 Support Issue](https://github.com/aws-amplify/amplify-js/issues/14600) -- HIGH confidence
- [GSAP npm](https://www.npmjs.com/package/gsap) -- v3.14.2 confirmed
- [@gsap/react npm](https://www.npmjs.com/package/@gsap/react) -- v2.1.2 confirmed
- [GSAP Free License Announcement](https://css-tricks.com/gsap-is-now-completely-free-even-for-commercial-use/) -- HIGH confidence
- [Tailwind CSS v4 Release](https://tailwindcss.com/blog/tailwindcss-v4) -- HIGH confidence
- [next-themes npm](https://www.npmjs.com/package/next-themes) -- v0.4.6 confirmed
- [Vercel AI SDK](https://ai-sdk.dev/docs/introduction) -- HIGH confidence
- [@ai-sdk/xai npm](https://www.npmjs.com/package/@ai-sdk/xai) -- v3.0.74 confirmed
- [AI SDK xAI Provider Docs](https://ai-sdk.dev/providers/ai-sdk-providers/xai) -- HIGH confidence
- [react-icons npm](https://www.npmjs.com/package/react-icons) -- v5.6.0 confirmed
- [Next.js Font Optimization](https://nextjs.org/docs/app/getting-started/fonts) -- HIGH confidence
- [Motion (Framer Motion) Comparison](https://blog.logrocket.com/best-react-animation-libraries/) -- MEDIUM confidence

---

*Stack research: 2026-04-02*
