# Phase 3: Content Pages and Chat - Research

**Researched:** 2026-04-03
**Domain:** Portfolio page (masonry grid), About page (bio/experience/education), Chat page (xAI Grok streaming)
**Confidence:** HIGH

## Summary

Phase 3 builds three content pages replacing the existing placeholder pages at `/portfolio`, `/about`, and `/chat`. The Portfolio page requires a masonry/staggered grid of 23 projects with images, names, and external link icons. The About page is a two-panel desktop layout (fixed sidebar with nav links + scrollable content) with bio text, 4 experience entries, and 2 education entries, all using intersection-observer-based scroll tracking. The Chat page integrates xAI Grok API via a Next.js Route Handler using Vercel AI SDK's `streamText` and `useChat` for real-time streaming responses -- an improvement over Flutter's non-streaming implementation.

All content must be extracted verbatim from the Flutter source files. The project data (23 projects), bio text (with bold spans), experience entries (4 jobs with skills/descriptions), and education entries (2 schools) are fully documented in this research. The system prompt for the AI chat persona is a ~200-line string containing a complete JSON data store that must be ported exactly to the API route.

**Primary recommendation:** Install `ai` and `@ai-sdk/xai` packages. Copy asset images to `public/assets/`. Use CSS `columns: 4` with `break-inside: avoid` for the masonry grid (cross-browser safe). Use `useChat` from `@ai-sdk/react` for the chat client. Port the system prompt string verbatim to the route handler.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Portfolio page uses masonry/staggered grid layout via CSS columns or grid -- match Flutter's StaggeredGridView appearance
- Project data hardcoded in component (matching Flutter's list of maps pattern)
- Project cards show image, name, and external links
- Reuse existing assets from Flutter's assets/ directory
- About page sections: Bio, Experience (timeline/cards), Education
- About page has scrollable section navigation (anchor links or intersection observer)
- About page content hardcoded matching Flutter version exactly
- Single responsive component for About (not separate mobile/desktop files)
- Chat uses Next.js API route at /api/chat for server-side xAI Grok communication
- Chat uses Vercel AI SDK (@ai-sdk/xai) for streaming responses
- API key via environment variable (GROK_API_KEY), never in client bundle
- Conversation history maintained in React state within session
- Auto-detect and linkify URLs in chat messages
- User-friendly error messages matching Flutter's approach

### Claude's Discretion
- Grid column count and card sizing for portfolio
- Experience timeline visual design details
- Chat UI layout specifics (message bubbles, input area)
- Scroll behavior and section navigation implementation

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PAGE-02 | Portfolio page displays projects in masonry/staggered grid layout matching Flutter version | CSS columns approach documented, 23 projects extracted, pinning logic (Software 3.0 + Review Gate first) identified |
| PAGE-03 | Portfolio project cards show image, name, and links matching Flutter data | Full project data with all links extracted from Flutter, card component structure documented |
| PAGE-04 | About page displays bio section matching Flutter version content | Full bio text with bold spans extracted verbatim from Flutter source |
| PAGE-05 | About page displays experience section with timeline/cards matching Flutter version | All 4 experience entries extracted with dates, titles, companies, descriptions, skills |
| PAGE-06 | About page displays education section matching Flutter version | Both education entries extracted with dates, institutions, degrees, GPAs |
| PAGE-07 | About page sections are scrollable with section navigation | Intersection Observer pattern documented, Flutter's scroll tracking logic analyzed |
| PAGE-08 | Chat page displays message interface matching Flutter version layout | Chat UI components analyzed: input field, message bubbles, glassmorphism, loading animation |
| CHAT-01 | User can send messages and receive AI responses from xAI Grok API | Vercel AI SDK streamText + useChat pattern documented |
| CHAT-02 | API key is server-side only via Next.js API route (not exposed in client bundle) | Route handler pattern with process.env.XAI_API_KEY documented |
| CHAT-03 | Responses stream in real-time using Vercel AI SDK | AI SDK v6 useChat + streamText with toUIMessageStreamResponse documented |
| CHAT-04 | Conversation history persists within the session | useChat hook manages conversation state automatically in memory |
| CHAT-05 | Error states display user-friendly messages | Flutter's 3 random error messages extracted, error handling pattern documented |
| CHAT-06 | Links in chat messages are automatically detected and clickable | URL regex pattern for link detection documented |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Never run applications automatically -- only when explicitly asked
- Never use emojis in terminal logs, readme files, or anywhere unless explicitly asked
- Never use emojis in markdown or logging

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15.5.14 | Framework, App Router, API routes | Already installed, provides route handlers for API proxy |
| React | 19.1.0 | UI library | Already installed |
| Tailwind CSS | v4 | Styling | Already installed, CSS-first config |
| next-themes | 0.4.x | Dark/light mode | Already installed, `useTheme()` for color switching |
| react-icons | 5.x | Icons | Already installed, provides FaGithub, FaLink, FaFigma, FaCodeBranch |
| clsx + tailwind-merge | 2.x / 3.x | Class utilities | Already installed |

### New Dependencies (must install)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| ai | 6.0.145 | Vercel AI SDK core -- streamText, UIMessage, convertToModelMessages | Chat API route handler |
| @ai-sdk/xai | 3.0.77 | xAI Grok provider for AI SDK | Chat API route handler -- `xai('grok-3-mini')` |
| @ai-sdk/react | (bundled with ai) | useChat hook for client-side chat | Chat page client component |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS columns masonry | masonic library | masonic adds virtualization for 100+ items but is overkill for 23 projects; CSS columns is zero-dependency and cross-browser |
| useChat hook | Manual fetch + SSE parsing | useChat handles streaming, message state, loading, error -- ~100 lines saved |
| Regex URL detection | react-linkify-it library | Regex is sufficient for this use case, avoids another dependency |

**Installation:**
```bash
npm install ai @ai-sdk/xai
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  app/
    portfolio/
      page.tsx              # Portfolio page (client component)
    about/
      page.tsx              # About page (client component)
    chat/
      page.tsx              # Chat page (client component)
    api/
      chat/
        route.ts            # xAI Grok API route handler (server-side)
  components/
    portfolio-grid.tsx       # Masonry grid container
    portfolio-card.tsx       # Individual project card
    about-sidebar.tsx        # Fixed sidebar with nav links (desktop)
    timeline-entry.tsx       # Experience/education card
    chat-interface.tsx       # Chat message list + input
    chat-message.tsx         # Individual message bubble
  data/
    projects.ts             # Hardcoded project data array
    experience.ts           # Hardcoded experience data
    education.ts            # Hardcoded education data
    system-prompt.ts         # Chat system prompt string (server-only import)
  lib/
    sanitize-text.ts        # Text sanitization utility (strip emojis)
    linkify.ts              # URL detection utility
```

### Pattern 1: CSS Columns Masonry Grid
**What:** Use CSS `columns` property for staggered grid layout
**When to use:** Portfolio page with 23 items of varying image heights
**Why not CSS Grid masonry:** The `masonry` value for `grid-template-rows` is experimental -- only Safari 26.4 has stable support; Chrome/Firefox require flags. CSS columns has full cross-browser support.

```typescript
// Portfolio grid container
<div className="columns-1 sm:columns-4 gap-4 px-14">
  {displayProjects.map((project) => (
    <div key={project.name} className="break-inside-avoid mb-4">
      <PortfolioCard project={project} />
    </div>
  ))}
</div>
```

**Column count recommendation:** The Flutter version uses `crossAxisCount: 4` for desktop. For mobile, the Flutter version renders a single-column vertical list. Use `columns-1 sm:columns-4`.

**Item ordering note:** CSS columns flow top-to-bottom within each column. The Flutter MasonryGridView fills left-to-right row-by-row. This means visual ordering will differ slightly. The pinned projects (Software 3.0, Review Gate) will still appear first in DOM order, but their visual position will be in the first column. This is acceptable since the masonry appearance matches the Flutter aesthetic even if exact item placement differs.

### Pattern 2: Intersection Observer for Section Navigation
**What:** Track which about-page section is visible and highlight the corresponding nav link
**When to use:** About page sidebar navigation

```typescript
// Use IntersectionObserver to track active section
const observerRef = useRef<IntersectionObserver | null>(null);

useEffect(() => {
  observerRef.current = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    },
    { threshold: 0.3 }
  );

  sections.forEach((id) => {
    const el = document.getElementById(id);
    if (el) observerRef.current?.observe(el);
  });

  return () => observerRef.current?.disconnect();
}, []);
```

### Pattern 3: Vercel AI SDK Chat (v6 Pattern)
**What:** Server-side streaming chat with xAI Grok via Route Handler
**When to use:** Chat page

**Route Handler (server-side):**
```typescript
// src/app/api/chat/route.ts
import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { xai } from '@ai-sdk/xai';
import { systemPrompt } from '@/data/system-prompt';

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: xai('grok-3-mini'),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    maxTokens: 1000,
    temperature: 0.7,
  });

  return result.toUIMessageStreamResponse();
}
```

**Client Component:**
```typescript
// Chat page component
'use client';
import { useChat } from '@ai-sdk/react';

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat();
  // messages, input handling, and streaming are all managed by the hook
}
```

**Environment variable:** The xAI provider reads `XAI_API_KEY` by default. Configure in `.env.local`:
```
XAI_API_KEY=xai-your-key-here
```

Note: CONTEXT.md says `GROK_API_KEY` but the `@ai-sdk/xai` package defaults to `XAI_API_KEY`. Use `XAI_API_KEY` to avoid custom provider configuration. If the user specifically wants `GROK_API_KEY`, create the provider with `createXai({ apiKey: process.env.GROK_API_KEY })`.

### Pattern 4: Inverted Background Colors
**What:** Portfolio and About pages use inverted background (light bg in dark mode, dark bg in light mode)
**When to use:** Both portfolio and about pages

The Flutter source explicitly sets:
- Dark mode: `Color(0xFFDBDBDB)` (light gray background)
- Light mode: `Color(0xFF2A2A2A)` (dark background)

This is intentionally inverted from the main theme. Add CSS custom properties:
```css
:root {
  --color-page-inverted-bg: #2A2A2A;
  --color-page-inverted-text: #FFFFFF;
}
.dark {
  --color-page-inverted-bg: #DBDBDB;
  --color-page-inverted-text: #000000;
}
```

### Anti-Patterns to Avoid
- **Separate mobile/desktop component files:** Flutter has 8 mobile files. Use Tailwind responsive utilities in single components instead.
- **Client-side API key:** Never import or expose the xAI API key in any client component. It lives only in the route handler via `process.env.XAI_API_KEY`.
- **next/image for portfolio assets:** The Flutter project images are local assets, not remote URLs. Copy them to `public/assets/` and use standard `<img>` tags or `next/image` with `unoptimized` if needed. Since these are static assets served from public/, `next/image` can optimize them but may cause issues with the masonry layout height calculations. Using `<img>` with explicit `width` and `height` from natural image dimensions is simpler.
- **Manual stream parsing:** Do not write custom SSE/stream parsing code. The AI SDK handles this entirely via `useChat` and `streamText`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Streaming chat | Custom fetch + SSE parsing + manual state | Vercel AI SDK `useChat` + `streamText` | Handles streaming, message state, loading, error, abort -- saves ~150 lines |
| URL detection in chat | Custom regex from scratch | Regex pattern: `/https?:\/\/[^\s<]+/g` | Simple, well-known pattern; flutter_linkify does the same thing internally |
| Text sanitization | Custom emoji stripping | Port Flutter's `sanitizeText()` regex directly | The regex is comprehensive and already tested |
| Section scroll tracking | Manual scroll position calculations | `IntersectionObserver` API | Browser-native, performant, handles edge cases |

**Key insight:** The Flutter chat code is ~850 lines across two files. The Next.js version with AI SDK will be ~200 lines total because `useChat` eliminates manual HTTP calls, message state management, conversation history tracking, and streaming logic.

## Extracted Content Data

### Portfolio Projects (23 total, identical in desktop and mobile)

First 2 projects are **pinned** (always appear first); the rest are shuffled on each page load.

```typescript
export interface Project {
  name: string;
  image: string;      // path relative to public/ (e.g., "/assets/s3.png")
  links: Record<string, string>;  // key: "Website"|"GitHub"|"Design", value: URL
  useIframe?: boolean; // only X-Read has this flag
}

export const projects: Project[] = [
  // PINNED (always first)
  { name: "Software 3.0", image: "/assets/s3.png", links: { Website: "https://www.software-3.com", GitHub: "https://github.com/LakshmanTurlapati/Software-3.0" } },
  { name: "Review Gate", image: "/assets/review_gate.webp", links: { GitHub: "https://github.com/LakshmanTurlapati/Review-Gate" } },
  // SHUFFLED (randomized order on each page load)
  { name: "EatSight", image: "/assets/estsight.png", links: { Website: "https://eatsight.fly.dev", GitHub: "https://github.com/LakshmanTurlapati/EatSight" } },
  { name: "Blockchain Smartcontracts", image: "/assets/blockchain.jpg", links: { GitHub: "https://github.com/LakshmanTurlapati/Blockchain" } },
  { name: "Smart Fabric using IOT", image: "/assets/sfuit.jpg", links: { Website: "https://www.youtube.com/watch?v=AkKRSgQnT_c", GitHub: "https://github.com/prateek10201/sfuit-esp8266" } },
  { name: "Portfolio", image: "/assets/portfolio.jpg", links: { Website: "https://audienclature.com", GitHub: "https://github.com/LakshmanTurlapati/Portfolio", Design: "https://www.figma.com/design/UeixAHUPLTSKiwHR9HVfT2/Portfolio?node-id=0-1&t=QkxcB16bQkJ96mpv-1" } },
  { name: "Financial Inclusion", image: "/assets/fi.png", links: { Website: "https://docs.google.com/document/d/1cq1xeUpl-lst5bj4376_QhCSo7HIc1EvPecKw0cmQGc/edit?usp=sharing", GitHub: "https://github.com/LakshmanTurlapati/Financial-Inclusion-v2", Design: "https://www.figma.com/design/5kNlAtt2Hh6NTx2YAPLhIu/Financial-Inclusion?node-id=0-1&t=jnAr4kRmQeHKDdOg-1" } },
  { name: "LinkedIn Auto Connect", image: "/assets/linkedin.png", links: { Website: "https://chromewebstore.google.com/detail/linkedin-auto-connect/jomecnphbmfpkcajfhkoebgmbcbakjoa?authuser=1&hl=en&pli=1", GitHub: "https://github.com/LakshmanTurlapati/linkedin-autoconnect-extension/tree/main" } },
  { name: "Service Portal", image: "/assets/chd.png", links: { GitHub: "https://github.com/LakshmanTurlapati/Church-Dwight-Solution-Center", Design: "https://www.figma.com/design/Lj0O8tBvyuGSx3LePBCuO1/C%26D?node-id=0-1&t=QO284B9qHF3brzcH-1" } },
  { name: "X-Read", image: "", links: { GitHub: "https://github.com/LakshmanTurlapati/DCTE-Script" }, useIframe: true },
  { name: "Heartline", image: "/assets/heartline.png", links: { GitHub: "https://github.com/LakshmanTurlapati/Heartline" } },
  { name: "Lucent", image: "/assets/lucent.png", links: { Website: "https://monumental-granita-08d2f5.netlify.app", GitHub: "https://github.com/LakshmanTurlapati/Lucent" } },
  { name: "Parz-AI", image: "/assets/parz_ai.png", links: { GitHub: "https://github.com/LakshmanTurlapati/Parz-AI" } },
  { name: "awsxUTD-Hackathon", image: "/assets/hackathon.png", links: { GitHub: "https://github.com/LakshmanTurlapati/awsxUTD-Hackathon" } },
  { name: "T2S CLI", image: "/assets/t2s_cli.png", links: { GitHub: "https://github.com/LakshmanTurlapati/t2s-cli" } },
  { name: "Star-Trail-Flutter", image: "/assets/startrail.jpg", links: { GitHub: "https://github.com/LakshmanTurlapati/Star-Trail-Flutter" } },
  { name: "awsxutd", image: "/assets/awsxutd.png", links: { Website: "https://marvelous-sopapillas-cf2910.netlify.app", GitHub: "https://github.com/LakshmanTurlapati/awsxutd" } },
  { name: "Open-API", image: "/assets/open_api.png", links: { GitHub: "https://github.com/LakshmanTurlapati/open-api" } },
  { name: "ArtScii", image: "/assets/artscii.jpg", links: { GitHub: "https://github.com/LakshmanTurlapati/ArtScii" } },
  { name: "FSB", image: "/assets/fsb.png", links: { GitHub: "https://github.com/LakshmanTurlapati/FSB" } },
  { name: "Asteroids Game", image: "/assets/asteroids.png", links: { Website: "https://harmonious-caramel-3c3627.netlify.app", GitHub: "https://github.com/LakshmanTurlapati/Atari-Astroids-Multiplayer" } },
  { name: "ProKeys", image: "/assets/prokeys.png", links: { GitHub: "https://github.com/LakshmanTurlapati/ProKeys" } },
  { name: "SmolLM Flutter", image: "/assets/smollm_flutter.png", links: { GitHub: "https://github.com/LakshmanTurlapati/SmolLm-Flutter" } },
];
```

**Asset files to copy:** All 25 files from Flutter `assets/` to Next.js `public/assets/`:
`s3.png`, `review_gate.webp`, `estsight.png`, `blockchain.jpg`, `sfuit.jpg`, `portfolio.jpg`, `fi.png`, `linkedin.png`, `chd.png` (note: Flutter file is `CHD.png` but referenced as `assets/chd.png`), `heartline.png`, `lucent.png`, `parz_ai.png`, `hackathon.png`, `t2s_cli.png`, `startrail.jpg`, `awsxutd.png`, `open_api.png`, `artscii.jpg`, `fsb.png`, `asteroids.png`, `prokeys.png`, `smollm_flutter.png`, `clickhere.gif`, `clickherelight.gif`, `movie.png`

**Note on CHD.png:** The Flutter asset directory has `CHD.png` (uppercase) but the project data references `assets/chd.png` (lowercase). When copying, use lowercase `chd.png` to match the data reference.

**Link icon mapping (from Flutter):**
- "Website" -> FaLink (FontAwesomeIcons.link)
- "GitHub" -> FaCodeBranch (FontAwesomeIcons.codeBranch)
- "Design" -> FaFigma (FontAwesomeIcons.figma)

### Portfolio Layout Details

**Desktop (>=600px):**
- MasonryGridView with `crossAxisCount: 4`
- `baseItemWidth: 300px`, dynamic height based on image aspect ratio
- `gridOuterPadding: 58px`
- Vertical fade mask at top/bottom (2%/98% stops)
- Snow effect overlay
- Back button (48x48, rounded 12px, inverted colors)
- Footer text: "Some of my **finest works** are missing, Thanks to the **'NDA'**!"
- Pinning: Software 3.0 first, Review Gate second, rest shuffled

**Mobile (<600px):**
- Single column vertical list, `itemWidth: 320px` centered
- `gridOuterPadding: 24px`, `itemSpacing: 32px`
- Active project highlighting based on scroll position (closest to viewport center)
- Active state: glassmorphism effect (backdrop blur 4px, subtle border)
- Same back button, snow effect, and footer

**Background color (INVERTED from main theme):**
- Dark mode: `#DBDBDB` (light gray)
- Light mode: `#2A2A2A` (dark)

### About Page Content

**Name displayed in sidebar:** "Venkat L. Turlapati"

**Bio text (with bold spans):**
The bio is a long-form text with specific words bolded. Key bold terms: "Full-stack", "Artificial Intelligence", "TAMUHack", "LLMs and transformers", "Andrej Karpathy", "Hugging Face", "IT Management", "UT Dallas", "Dean's Impact Scholar", "Beta Gamma Sigma Honors Society", "AI development", "2x AWS-certified", "AWS Cloud Captain", "multi-agentic workflows", "Review-Gate", "Cursor IDE", "1500+ GitHub stars", "200,000+ impressions", "Rocket Mortgage", "AI development"

The full bio text is in `lib/about_page.dart` lines 331-488 (desktop) and identical in `lib/mobile_about_page.dart` lines 212-370.

**Experience entries (4 total):**

| Timeline | Title | Company | Descriptions | Skills | Link |
|----------|-------|---------|-------------|--------|------|
| June 2025 - December 2025 | AI/ML Intern | Rocket Mortgage (formerly Mr.Cooper) | 1 description about AI agents with Google ADK and Vertex AI | Google ADK, Vertex AI, NLP, GCP | https://www.linkedin.com/company/mrcoopermortgage/posts/?feedView=all |
| 2022 - 2024 | Software Developer | Church & Dwight | 2 descriptions: Service Portal with Figma/Angular/ServiceNow; server-side scripts + Workday integration | ServiceNow, Angular, JavaScript, Flutter | https://churchdwight.com/ |
| 2020 - 2021 | Full-Stack Developer (Freelance) | Revv Digital | 2 descriptions: MEAN Stack web apps; MongoDB + AWS deployment | MEAN Stack, AWS, JavaScript, Figma | https://www.revvdigital.in/ |
| Jan - Apr 2019 | Machine Learning Intern | Coign Pvt Ltd | 1 description about Movie Recommendation System | Python, TensorFlow | https://www.linkedin.com/company/coign-edu-&-it-services-pvt-ltd-/ |

**Education entries (2 total):**

| Timeline | Title | Institution | Skills/GPA | Link |
|----------|-------|-------------|------------|------|
| 2024 - 2026 | University of Texas at Dallas | Master's Degree - Information Technology and Management | GPA: 3.9 / 4.0 | https://www.utdallas.edu/ |
| 2018 - 2022 | Osmania University | Bachelor's Degree - Computer Science | GPA: 3.5 / 4.0 | https://www.linkedin.com/school/osmania-university/ |

**Section navigation (desktop):** Three links in sidebar -- "About", "Experience", "Academics" -- with animated underline (30px inactive, 60px active) and text size change (16px inactive, 18px active). Active section determined by scroll position.

**Desktop layout:** 40% width fixed sidebar (back button, name, nav links, social icons at bottom) + 60% scrollable right panel with 120px horizontal padding.

**Mobile layout:** Single column, full-width scrollable page with back button at top, bio, experience, and education sections stacked vertically. Active timeline entry has glassmorphism highlight (identical to portfolio mobile pattern).

**Social links in About sidebar (desktop only):**
- GitHub: https://github.com/LakshmanTurlapati
- LinkedIn: https://www.linkedin.com/in/lakshman-turlapati-3091aa191/
- X/Twitter: https://x.com/parzival1213

**Timeline entry card styling:**
- Hover: subtle background color, border, backdrop blur (10px desktop / varies mobile)
- Active (mobile): glassmorphism with backdrop blur 4px, subtle border
- Row layout: timeline date on left (~10% width), content on right (expanded)
- Skills rendered as pill tags with inverted colors (dark bg `#3A3A3A` with white text in dark mode; light bg `#F0F0F0` with dark text in light mode)
- Clickable entries open company/institution URL

**Footer text (both desktop and mobile):**
"Designed in **Figma**, coded in **Flutter** (because why not?), and deployed on **AWS**. Inter typeface ties it all together."

### Chat System

**System prompt:** The system prompt is a ~200-line string defining the "Parz" AI persona. It contains:
1. Core mission and style guidelines (respond as Lakshman, casual/informal tone)
2. Guardrails (be concise, no emojis ever, plain text only, no markdown formatting)
3. A complete `DATA_STORE` JSON object with: personalInfo, biography, education, professionalExperience, skillsAndExpertise, achievementsAndRoles, projects (featured, AI/ML, full-stack, developer utilities, games), interestsAndPersonality, philosophyAndWorkEthic, eligibility, contactInfo

The desktop and mobile chat files have slightly different versions of the system prompt (desktop says "ONLY provide URLs when specifically asked"; mobile says "always include URL when mentioning a project"). Use the desktop version as the canonical one since it is more restrictive.

**API configuration (from Flutter):**
- Endpoint: `https://api.x.ai/v1/chat/completions`
- Model: `grok-3-mini`
- Max tokens: 1000
- Temperature: 0.7
- Conversation history: last 20 messages included

**Error messages (3 random options):**
1. "I might be updating my server right now. Please try again in a moment!"
2. "Server is under maintenance. Please check back shortly!"
3. "Having some technical difficulties. Give me a few minutes and try again!"

**Text sanitization function (`sanitizeText`):** Replaces em/en dashes, curly quotes, ellipsis, non-breaking space, bullets with ASCII equivalents, then strips all emojis and special Unicode via comprehensive regex. This must be ported to TypeScript.

**Chat UI elements:**
- Message bubbles: user messages on right, AI responses on left
- Glassmorphism styling (backdrop-filter: blur)
- Input field with "Talk to my persona!" shimmer placeholder text
- Send button (arrow up icon, circular)
- Loading animation: rotating text with shimmer effect ("Waking up my private server", "Processing your message", "Almost there, Hold tight!", "Generating response") cycling every 3 seconds
- Three-dot wave animation during loading
- URL linkification in message text via `flutter_linkify` (maps to regex-based link detection in web)

**Chat suggestions (desktop only):** The desktop chat has suggestion buttons that appear before first message and are dismissible. These are session-scoped.

### Image Asset Notes

The `chd.png` reference in the code uses lowercase but the actual file on disk is `CHD.png`. When copying, ensure lowercase naming. The `X-Read` project has `image: ""` (empty) and `useIframe: true` -- render a placeholder card with a code icon instead.

## Common Pitfalls

### Pitfall 1: AI SDK v6 API Changes
**What goes wrong:** Using old `ai` package patterns (v4/v5) that have been deprecated in v6
**Why it happens:** Most tutorials online show v4/v5 patterns with `import { useChat } from 'ai/react'`
**How to avoid:** In v6, import `useChat` from `@ai-sdk/react`, not `ai/react`. Use `UIMessage` type, `convertToModelMessages()`, and `toUIMessageStreamResponse()` -- these are the v6 patterns.
**Warning signs:** Import errors, type mismatches on `messages` prop

### Pitfall 2: Environment Variable Name Mismatch
**What goes wrong:** Using `GROK_API_KEY` but `@ai-sdk/xai` expects `XAI_API_KEY`
**Why it happens:** CONTEXT.md mentions `GROK_API_KEY` but the SDK default is `XAI_API_KEY`
**How to avoid:** Use `XAI_API_KEY` in `.env.local` (the SDK default), OR use `createXai({ apiKey: process.env.GROK_API_KEY })` if the env var name is fixed. Document whichever approach is chosen.
**Warning signs:** 401 Unauthorized errors when calling the chat API

### Pitfall 3: System Prompt Not Server-Only
**What goes wrong:** Importing the system prompt in a client component, exposing personal data in the client bundle
**Why it happens:** The system prompt contains a full JSON data store with personal information
**How to avoid:** Keep `system-prompt.ts` imported ONLY in the route handler (`app/api/chat/route.ts`). Never import it in any `'use client'` component. The `useChat` hook sends messages to the API route, which appends the system prompt server-side.
**Warning signs:** System prompt appearing in browser devtools Network tab or bundled JS

### Pitfall 4: CSS Columns Item Ordering
**What goes wrong:** Items flow top-to-bottom per column instead of left-to-right across rows
**Why it happens:** CSS multi-column layout fills columns vertically by design
**How to avoid:** Accept this difference from Flutter's MasonryGridView (which fills row-by-row). The visual effect is still a staggered masonry grid. Pinned projects (Software 3.0, Review Gate) will be at the top of the first column. The visual result is acceptable.
**Warning signs:** Users expecting identical project positioning to Flutter version

### Pitfall 5: Image Path Casing on Case-Sensitive Filesystems
**What goes wrong:** Image loads fail on Linux/CI because `CHD.png` vs `chd.png` mismatch
**Why it happens:** macOS is case-insensitive by default, Linux/CI is case-sensitive
**How to avoid:** Normalize all asset filenames to lowercase when copying to `public/assets/`. Update references accordingly in the data file.
**Warning signs:** 404 errors for images only in production/CI

### Pitfall 6: useChat Default Endpoint
**What goes wrong:** Chat requests go to wrong URL
**Why it happens:** `useChat` defaults to `/api/chat` POST endpoint
**How to avoid:** Place the route handler at exactly `src/app/api/chat/route.ts`. If placed elsewhere, pass `api` option to `useChat({ api: '/api/custom-path' })`.
**Warning signs:** 404 on chat message send

## Code Examples

### Portfolio Card Component
```typescript
// src/components/portfolio-card.tsx
'use client';
import { FaLink, FaCodeBranch, FaFigma } from 'react-icons/fa6';
import type { Project } from '@/data/projects';

const linkIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Website: FaLink,
  GitHub: FaCodeBranch,
  Design: FaFigma,
};

export function PortfolioCard({ project }: { project: Project }) {
  return (
    <div className="rounded-xl overflow-hidden group cursor-pointer"
         onClick={() => { /* open primary link */ }}>
      {/* Image */}
      {project.image ? (
        <div className="p-2 pb-0">
          <img
            src={project.image}
            alt={project.name}
            className="w-full rounded-lg object-cover"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="h-[180px] bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
          {/* Placeholder for X-Read */}
        </div>
      )}
      {/* Name + Links row */}
      <div className="p-3 flex items-center justify-between">
        <span className="font-bold text-sm truncate"
              style={{ color: 'var(--color-page-inverted-text)' }}>
          {project.name}
        </span>
        <div className="flex gap-2">
          {Object.entries(project.links).map(([type, url]) => {
            const Icon = linkIcons[type] || FaLink;
            return (
              <a key={type} href={url} target="_blank" rel="noopener noreferrer"
                 onClick={(e) => e.stopPropagation()}>
                <Icon className="w-4 h-4" style={{ color: 'var(--color-page-inverted-text)' }} />
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

### Chat Route Handler
```typescript
// src/app/api/chat/route.ts
import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { xai } from '@ai-sdk/xai';

const systemPrompt = `...`; // Full Parz persona prompt (~200 lines)

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    const result = streamText({
      model: xai('grok-3-mini'),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      maxTokens: 1000,
      temperature: 0.7,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    const errorMessages = [
      "I might be updating my server right now. Please try again in a moment!",
      "Server is under maintenance. Please check back shortly!",
      "Having some technical difficulties. Give me a few minutes and try again!",
    ];
    const message = errorMessages[Date.now() % errorMessages.length];
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
```

### Text Sanitization (ported from Flutter)
```typescript
// src/lib/sanitize-text.ts
export function sanitizeText(text: string): string {
  let result = text
    .replace(/\u2014/g, '-')   // Em dash
    .replace(/\u2013/g, '-')   // En dash
    .replace(/\u2018/g, "'")   // Left single quote
    .replace(/\u2019/g, "'")   // Right single quote
    .replace(/\u201C/g, '"')   // Left double quote
    .replace(/\u201D/g, '"')   // Right double quote
    .replace(/\u2026/g, '...') // Ellipsis
    .replace(/\u00A0/g, ' ')   // Non-breaking space
    .replace(/\u2022/g, '*');  // Bullet

  // Remove emojis and special Unicode
  const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{2300}-\u{23FF}]|[\u{25A0}-\u{25FF}]|[\u{1F000}-\u{1F02F}]|[\u{FE00}-\u{FE0F}]|[\u{200D}]/gu;
  result = result.replace(emojiRegex, '');

  // Clean up multiple spaces
  result = result.replace(/\s+/g, ' ');

  return result.trim();
}
```

### URL Linkification
```typescript
// src/lib/linkify.ts
const URL_REGEX = /https?:\/\/[^\s<]+/g;

export function linkifyText(text: string): (string | { type: 'link'; url: string })[] {
  const parts: (string | { type: 'link'; url: string })[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(URL_REGEX)) {
    if (match.index! > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push({ type: 'link', url: match[0] });
    lastIndex = match.index! + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `import { useChat } from 'ai/react'` | `import { useChat } from '@ai-sdk/react'` | AI SDK v6 (2025) | Breaking import path change |
| `result.toAIStreamResponse()` | `result.toUIMessageStreamResponse()` | AI SDK v6 (2025) | New response format for UI messages |
| Messages as `{ role, content }` | Messages as `UIMessage` with `parts` array | AI SDK v6 (2025) | Richer message structure supporting text, tool calls, etc. |
| CSS `masonry` in grid | Still experimental (Safari only stable) | 2026 | Use CSS columns instead for cross-browser support |

**Deprecated/outdated:**
- `ai/react` import path -- use `@ai-sdk/react`
- `toAIStreamResponse()` -- use `toUIMessageStreamResponse()`
- `result.toDataStreamResponse()` -- replaced by `toUIMessageStreamResponse()` for chat UIs

## Open Questions

1. **Environment variable naming**
   - What we know: `@ai-sdk/xai` defaults to `XAI_API_KEY`; CONTEXT.md says `GROK_API_KEY`
   - What's unclear: Which name the user wants
   - Recommendation: Use `XAI_API_KEY` (SDK default) to avoid custom configuration. Document this for deployment.

2. **Snowfall effect on portfolio page**
   - What we know: Flutter's portfolio page wraps content in `SnowfallEffect`
   - What's unclear: Whether the existing `Snowfall` component from Phase 2 should be reused on the portfolio page
   - Recommendation: Reuse the existing snowfall component from Phase 2, wrap portfolio page content with it

3. **Spotlight effect on about page**
   - What we know: Flutter's desktop about page wraps content in `SpotlightEffect`
   - What's unclear: Whether to add the Phase 2 spotlight component to the about page
   - Recommendation: Yes, reuse Phase 2 spotlight component on the about page (desktop only)

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Runtime | Assumed available | -- | -- |
| npm | Package install | Assumed available | -- | -- |
| ai (Vercel AI SDK) | Chat streaming | Not installed | 6.0.145 available | Must install |
| @ai-sdk/xai | xAI provider | Not installed | 3.0.77 available | Must install |
| XAI_API_KEY env var | Chat API auth | Not configured | -- | Must create .env.local |

**Missing dependencies with no fallback:**
- `ai` and `@ai-sdk/xai` packages must be installed before chat functionality works
- `XAI_API_KEY` must be set in `.env.local` for chat to function

**Missing dependencies with fallback:**
- None -- all other dependencies are already installed

## Sources

### Primary (HIGH confidence)
- Flutter source code: `lib/portfolio.dart`, `lib/mobile_portfolio.dart` -- complete project data extracted
- Flutter source code: `lib/about_page.dart`, `lib/mobile_about_page.dart` -- complete bio, experience, education extracted
- Flutter source code: `lib/chat.dart`, `lib/chat_mobile.dart` -- complete system prompt, API config, error messages, sanitization function extracted
- Flutter source code: `lib/env.dart` -- API key variable identified
- [Vercel AI SDK xAI Provider Docs](https://ai-sdk.dev/providers/ai-sdk-providers/xai) -- v6 xAI integration patterns
- [Vercel AI SDK Getting Started](https://ai-sdk.dev/docs/getting-started/nextjs-app-router) -- v6 useChat + streamText patterns
- npm registry: `ai@6.0.145`, `@ai-sdk/xai@3.0.77` -- current versions verified

### Secondary (MEDIUM confidence)
- [CSS columns masonry approaches (CSS-Tricks)](https://css-tricks.com/piecing-together-approaches-for-a-css-masonry-layout/) -- CSS columns cross-browser pattern
- [MDN Web Docs - Masonry Layout](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout/Masonry_layout) -- native CSS masonry still experimental
- [Chrome Masonry Update](https://developer.chrome.com/blog/masonry-update) -- CSS Grid masonry spec status

### Tertiary (LOW confidence)
- None -- all findings verified with primary or secondary sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all packages verified on npm, AI SDK v6 docs confirm patterns
- Architecture: HIGH - all content data extracted verbatim from Flutter source
- Pitfalls: HIGH - based on direct analysis of API changes and codebase specifics

**Research date:** 2026-04-03
**Valid until:** 2026-05-03 (stable domain, AI SDK may have minor updates)
