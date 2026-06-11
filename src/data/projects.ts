export interface Project {
  name: string;
  image: string;
  links: Record<string, string>;
  useIframe?: boolean;
  aliases?: string[];
  preferredTarget?: keyof Project['links'];
}

export interface ProjectDetail {
  tagline?: string;
  year?: string;
  role?: string;
  stack?: string[];
  overview?: string;
  highlights?: string[];
  sections?: { heading: string; body: string }[];
  stats?: { label: string; value: string }[];
}

// Per-project hover animation effect for the DataGrid
export type HoverEffect = 'ripple' | 'wave' | 'spiral' | 'scan' | 'magnet' | 'scatter' | 'flow' | 'binary' | 'constellation' | 'heartbeat';

export const PROJECT_EFFECTS: Record<string, HoverEffect> = {
  "FSB / Full Self Browsing": "ripple",
  "GitFly": "flow",
  "Review Gate": "heartbeat",
  "Blockchain Smartcontracts": "constellation",
  "Smart Fabric using IOT": "wave",
  "Portfolio": "spiral",
  "Financial Inclusion": "ripple",
  "LinkedIn Auto Connect": "magnet",
  "Service Portal": "scan",
  "X-Read": "binary",
  "Heartline": "heartbeat",
  "Lucent": "flow",
  "Parz-AI": "constellation",
  "awsxUTD-Hackathon": "scatter",
  "T2S CLI": "scan",
  "Star-Trail-Flutter": "spiral",
  "awsxutd": "scatter",
  "Open-API": "binary",
  "ArtScii": "binary",
  "FSB": "ripple",
  "Asteroids Game": "scatter",
  "ProKeys": "wave",
  "SmolLM Flutter": "flow",
};

// First project is pinned (always shown first), rest are shuffled on each render
export const pinnedProjects: Project[] = [
  {
    name: "FSB / Full Self Browsing",
    image: "/assets/fsb.png",
    links: { Website: "https://www.full-selfbrowsing.com", GitHub: "https://github.com/LakshmanTurlapati/FSB" },
    aliases: ["FSB", "Full Self Browsing", "full-selfbrowsing", "full self browsing"],
    preferredTarget: "Website",
  },
  {
    name: "GitFly",
    image: "",
    links: { Website: "https://gitfly.ai" },
    aliases: ["git fly", "gitfly.ai"],
    preferredTarget: "Website",
  },
  {
    name: "Review Gate",
    image: "/assets/review_gate.webp",
    links: { GitHub: "https://github.com/LakshmanTurlapati/Review-Gate" },
    aliases: ["ReviewGate", "review-gate"],
    preferredTarget: "GitHub",
  },
];

export const shuffleableProjects: Project[] = [
  { name: "Blockchain Smartcontracts", image: "/assets/blockchain.jpg", links: {} },
  { name: "Smart Fabric using IOT", image: "/assets/sfuit.jpg", links: { Website: "https://www.youtube.com/watch?v=AkKRSgQnT_c", GitHub: "https://github.com/prateek10201/sfuit-esp8266" } },
  { name: "Portfolio", image: "/assets/portfolio.jpg", links: { Website: "https://parzival.live", GitHub: "https://github.com/LakshmanTurlapati/Portfolio" } },
  { name: "Financial Inclusion", image: "/assets/fi.png", links: { Website: "https://docs.google.com/document/d/1cq1xeUpl-lst5bj4376_QhCSo7HIc1EvPecKw0cmQGc/edit", GitHub: "https://github.com/LakshmanTurlapati/Financial-Inclusion-v2" } },
  { name: "LinkedIn Auto Connect", image: "/assets/linkedin.png", links: { Website: "https://chromewebstore.google.com/detail/linkedin-auto-connect/jomecnphbmfpkcajfhkoebgmbcbakjoa", GitHub: "https://github.com/LakshmanTurlapati/linkedin-autoconnect-extension/tree/main" } },
  { name: "Service Portal", image: "/assets/chd.png", links: { GitHub: "https://github.com/LakshmanTurlapati/Church-Dwight-Solution-Center" } },
  { name: "X-Read", image: "", links: { GitHub: "https://github.com/LakshmanTurlapati/DCTE-Script" }, useIframe: true },
  { name: "Heartline", image: "/assets/heartline.png", links: { GitHub: "https://github.com/LakshmanTurlapati/Heartline" } },
  { name: "Lucent", image: "/assets/lucent.png", links: { Website: "https://monumental-granita-08d2f5.netlify.app", GitHub: "https://github.com/LakshmanTurlapati/Lucent" } },
  { name: "Parz-AI", image: "/assets/parz_ai.png", links: { GitHub: "https://github.com/LakshmanTurlapati/Parz-AI" }, aliases: ["Parz AI", "Parz", "parz ai"], preferredTarget: "GitHub" },
  { name: "awsxUTD-Hackathon", image: "/assets/hackathon.png", links: { GitHub: "https://github.com/LakshmanTurlapati/awsxUTD-Hackathon" } },
  { name: "T2S CLI", image: "/assets/t2s_cli.png", links: { GitHub: "https://github.com/LakshmanTurlapati/t2s-cli" }, aliases: ["T2S", "text to sql", "text-to-sql"], preferredTarget: "GitHub" },
  { name: "Star-Trail-Flutter", image: "/assets/startrail.jpg", links: { GitHub: "https://github.com/LakshmanTurlapati/Star-Trail-Flutter" } },
  { name: "awsxutd", image: "/assets/awsxutd.png", links: { Website: "https://marvelous-sopapillas-cf2910.netlify.app", GitHub: "https://github.com/LakshmanTurlapati/awsxutd" } },
  { name: "Open-API", image: "/assets/open_api.png", links: { GitHub: "https://github.com/LakshmanTurlapati/open-api" } },
  { name: "ArtScii", image: "/assets/artscii.jpg", links: { GitHub: "https://github.com/LakshmanTurlapati/ArtScii" } },
  { name: "Asteroids Game", image: "/assets/asteroids.png", links: { Website: "https://harmonious-caramel-3c3627.netlify.app", GitHub: "https://github.com/LakshmanTurlapati/Atari-Astroids-Multiplayer" } },
  { name: "ProKeys", image: "/assets/prokeys.png", links: { GitHub: "https://github.com/LakshmanTurlapati/ProKeys" } },
  { name: "SmolLM Flutter", image: "/assets/smollm_flutter.png", links: { GitHub: "https://github.com/LakshmanTurlapati/SmolLm-Flutter" } },
];

export const allProjects: Project[] = [...pinnedProjects, ...shuffleableProjects];

function normalizeProjectKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function resolveProject(input: string): Project | null {
  const normalizedInput = normalizeProjectKey(input);
  if (!normalizedInput) return null;

  return allProjects.find((project) => {
    const keys = [project.name, ...(project.aliases || [])];
    return keys.some((key) => normalizeProjectKey(key) === normalizedInput);
  }) || null;
}

export function isApprovedProjectUrl(url: string): boolean {
  return allProjects.some((project) =>
    Object.values(project.links).some((approvedUrl) => approvedUrl === url)
  );
}

export function getProjectBrowserTarget(project: Project): { url: string; label: string } | null {
  const targetOrder = [project.preferredTarget, 'Website', 'Design', 'GitHub'].filter(Boolean) as string[];
  const targetKey = targetOrder.find((key) => project.links[key]);

  if (!targetKey) return null;

  const url = project.links[targetKey];
  if (!url || !isApprovedProjectUrl(url)) return null;

  const labels: Record<string, string> = {
    Website: 'Visit site',
    Design: 'Design',
    GitHub: 'Source',
  };

  return { url, label: labels[targetKey] || targetKey };
}

export const PROJECT_DETAILS: Record<string, ProjectDetail> = {
  "FSB / Full Self Browsing": {
    tagline: "AI that can visibly operate the browser",
    year: "2026",
    role: "Author \u00b7 Open-source builder",
    stack: ["AI Agents", "Browser Automation", "TypeScript", "Web"],
    overview: "FSB / Full Self Browsing is a public browser automation assistant that turns natural-language intent into visible browsing actions. The point is not fake magic; it is making AI control feel observable, bounded, and useful.",
    highlights: [
      "Public project home at https://www.full-selfbrowsing.com.",
      "Explores AI-driven browser control with a visible user-facing control surface.",
      "Inspired the portfolio's v4.1 direction for Parz-controlled navigation and browsing.",
    ],
    sections: [
      { heading: "The spark", body: "Most AI browsing demos either feel hidden or overpromise control. FSB is about making the assistant's actions visible enough that users can trust what is happening." },
      { heading: "The portfolio connection", body: "Parz's next control layer borrows this philosophy: show the user when the AI is navigating, opening projects, or moving through the site." },
    ],
  },
  "GitFly": {
    tagline: "A public product for faster code work",
    year: "2026",
    role: "Builder",
    stack: ["AI", "Developer Tools", "Product Engineering"],
    overview: "GitFly is a current flagship project available publicly at https://gitfly.ai. The public story is the product and what it helps builders do; the source code and private implementation details are intentionally not public.",
    highlights: [
      "Public platform link only: https://gitfly.ai.",
      "Presented as a product story, not a source-code showcase.",
      "Part of Lakshman's current AI-builder and developer-tools narrative.",
    ],
    sections: [
      { heading: "Public boundary", body: "GitFly's source and private implementation details stay private. The portfolio and Parz should point people to the public platform and product story only." },
    ],
  },
  "Review Gate": {
    tagline: "Turn 500 Cursor requests into 2,500",
    year: "2025 \u00b7 v2.7.3",
    role: "Author \u00b7 Open-source maintainer",
    stack: ["MCP", "Python", "Cursor Extension", "Faster-Whisper", "Node"],
    overview: "A Cursor IDE rule + MCP server that forces the agent to pause before ending a request, opening a popup where you can keep iterating \u2014 with voice, text, and image input \u2014 all inside a single main request\u2019s tool-call budget.",
    stats: [
      { label: "Request multiplier", value: "~5x" },
      { label: "GitHub stars", value: "1500+" },
      { label: "Platforms", value: "macOS \u00b7 Win \u00b7 Linux" },
    ],
    highlights: [
      "Voice-activated sub-prompts via local Faster-Whisper AI \u2014 no cloud, no privacy risk.",
      "Image upload (PNG/JPG/GIF/BMP/WebP) so the agent can see screenshots, mockups, errors.",
      "Beautiful popup with orange-glow design and a real-time MCP status indicator.",
      "One-click installers for macOS & Windows; merge-safe MCP config that preserves existing entries.",
      "GitHub Actions workflow packages the canonical VSIX against a release manifest.",
    ],
    sections: [
      { heading: "The problem", body: "Cursor would drop the mic way too early \u2014 a complex task would use ~5 of its ~25 tool calls, then the agent would sign off. Follow-up tweaks meant burning another of my ~500 monthly requests. That felt wrong." },
      { heading: "The idea", body: "Instruct the agent, via a Cursor rule, to call a review_gate_chat MCP tool before finishing. The tool opens a popup and waits. The agent can\u2019t exit until I type TASK_COMPLETE \u2014 so the remaining tool-call budget stays available for iterative sub-prompts inside the same main request." },
      { heading: "V2 upgrades", body: "V1 was a terminal script. V2 is native: an MCP tool, a VSIX extension, local Whisper transcription, image uploads, real-time status, and a cross-platform installer. The community pushed for it: 1500+ stars and roughly 200,000+ impressions showed the problem was real." },
    ],
  },
  "Blockchain Smartcontracts": {
    tagline: "EHR integrity via smart contracts",
    year: "2021",
    role: "Developer",
    stack: ["Solidity", "Ethereum", "Smart Contracts", "Web3"],
    overview: "A proof-of-concept dApp that stores Electronic Health Record hashes on-chain, so any tampering with the underlying record is immediately detectable.",
    highlights: [
      "Hash-on-chain / data-off-chain pattern keeps PHI private while still auditable.",
      "Role-based access for patients, doctors, and insurance verifiers.",
      "Event log doubles as an immutable audit trail.",
    ],
  },
  "Smart Fabric using IOT": {
    tagline: "Wearable IoT for physiological monitoring",
    year: "2021",
    role: "Co-developer",
    stack: ["ESP8266", "Arduino", "Sensors", "Firebase"],
    overview: "A fabric-integrated IoT prototype that reads biometric signals and streams them to a cloud dashboard in real time.",
    highlights: [
      "ESP8266 paired with pulse/temperature sensors stitched into the fabric.",
      "Live dashboard for caregivers \u2014 data reaches the cloud in < 1 second.",
      "Featured on YouTube with a walkthrough of the hardware + firmware.",
    ],
  },
  "Portfolio": {
    tagline: "This site \u2014 built in Flutter Web",
    year: "2024 \u00b7 v3",
    role: "Designer & developer",
    stack: ["Flutter Web", "Dart", "Figma", "Google Fonts"],
    overview: "The third iteration of parzival.live, built entirely in Flutter Web. A single codebase renders both desktop and mobile layouts, with an AI chat persona, portfolio gallery, and animated backgrounds.",
    highlights: [
      "AI chat persona fine-tuned on my own writing and project notes.",
      "Responsive adaptive layouts \u2014 desktop masonry, mobile stack.",
      "Particle background + dot-matrix easter egg on the home screen.",
      "Theme system with system-preference detection and persistent choice.",
    ],
  },
  "Financial Inclusion": {
    tagline: "Banking UX for the underbanked",
    year: "2023",
    role: "UX researcher & designer",
    stack: ["Figma", "Design Research", "Prototyping"],
    overview: "A design-research project exploring how mobile-first banking can serve users who have been historically excluded from the financial system.",
    highlights: [
      "Field research synthesized into 4 primary personas.",
      "End-to-end Figma prototype covering onboarding, savings, and micro-loans.",
      "Written report documenting methodology + findings.",
    ],
  },
  "LinkedIn Auto Connect": {
    tagline: "Published Chrome extension \u2014 automate connection requests",
    year: "2024",
    role: "Author",
    stack: ["Chrome Extension", "JavaScript", "DOM scripting"],
    overview: "A Chrome extension that auto-sends LinkedIn connection requests with a personalized note, throttled to look human. Available on the Chrome Web Store.",
    highlights: [
      "Throttled click loop with randomized delays to avoid LinkedIn\u2019s anti-bot detection.",
      "Personalized-note template with variable interpolation.",
      "Published on the Chrome Web Store with real users.",
    ],
  },
  "Service Portal": {
    tagline: "ServiceNow portal redesign for Church & Dwight",
    year: "2022\u20132024",
    role: "Lead developer & UI designer",
    stack: ["ServiceNow", "AngularJS", "SCSS", "Figma"],
    overview: "A complete redesign and rebuild of Church & Dwight\u2019s employee Service Portal on ServiceNow \u2014 14 custom widgets, a new design system, and Workday integration.",
    highlights: [
      "14 custom widgets covering header, nav, KB search, data tables, catalog forms.",
      "Workday integration via Scripted REST APIs for onboarding/off-boarding automation.",
      "End-to-end design in Figma, linked below.",
    ],
  },
  "X-Read": {
    tagline: "Document classification & text extraction",
    year: "2024",
    role: "Author",
    stack: ["Python", "pdfminer", "pytesseract", "pandas"],
    overview: "A Python script that classifies business documents (RFQs, POs, delivery notices) across .eml, .pdf, .xlsx, .csv, and image files \u2014 including attachments inside emails \u2014 and extracts structured fields.",
    highlights: [
      "Multi-format text extraction with OCR fallback via Tesseract.",
      "Regex-driven field extraction for RFQ number, agency, due date, line items, quotes.",
      "GUI file picker or CLI mode \u2014 works either way.",
    ],
  },
  "Parz-AI": {
    tagline: "Your own AI twin \u2014 finetune, host, done",
    year: "2024",
    role: "Author",
    stack: ["Python", "SmolLM-360M", "HuggingFace", "GGUF", "FastAPI"],
    overview: "An all-in-one CLI to finetune, run, convert, and host a personal AI persona built on SmolLM-360M. Small enough to run on a MacBook, flexible enough to sound like you.",
    highlights: [
      "Finetune on a JSON dataset of your own conversations and writings.",
      "Interactive inference mode for testing the persona.",
      "Convert to GGUF (with optional quantization) for optimized deployment.",
      "Host as a local HTTP API with a web test interface.",
    ],
    sections: [
      { heading: "Why SmolLM", body: "Most persona projects assume you\u2019ll rent a GPU in the cloud. SmolLM runs on consumer hardware and still captures personality convincingly after finetuning on 20\u2013100 QA pairs." },
    ],
  },
  "T2S CLI": {
    tagline: "Natural language \u2192 SQL & MongoDB, in your terminal",
    year: "2025 \u00b7 v0.3.0",
    role: "Author",
    stack: ["Python", "Gemma", "SQLCoder", "Claude", "MongoDB", "PyPI"],
    overview: "A privacy-first (or cloud-powered) CLI that converts plain English into SQL or MQL. Run it fully offline with local models, or plug in Claude / Grok / Gemini / GPT for maximum accuracy.",
    stats: [
      { label: "Databases", value: "4 (+ MongoDB)" },
      { label: "Context (Grok)", value: "256K" },
      { label: "Tests passing", value: "29" },
    ],
    highlights: [
      "Dual engines: SQL (SQLite / Postgres / MySQL) and MQL (MongoDB aggregations, $lookup, $group).",
      "Four cloud providers wired in \u2014 Claude Haiku 4.5, Grok Code Fast 1, Gemini 2.5 Flash, GPT-4o Mini.",
      "Three local models for offline mode \u2014 Gemma 3 (4B/12B), SQLCoder 7B, SmolVLM 500M.",
      "Schema-aware validation with automatic _id exclusion and field checks.",
      "Rich terminal UI with syntax highlighting and adaptive layouts.",
    ],
  },
  "Star-Trail-Flutter": {
    tagline: "Published Flutter package \u2014 star trail animation",
    year: "2024",
    role: "Author",
    stack: ["Flutter", "Dart", "pub.dev"],
    overview: "A published Flutter package that renders a star-trail animation \u2014 250 stars rotating in a circular motion with fading inner radii.",
    stats: [
      { label: "Stars (default)", value: "250" },
      { label: "Full rotation", value: "180s" },
      { label: "Package", value: "star_trail 1.0.0" },
    ],
    highlights: [
      "Customizable star count via numberOfStars prop.",
      "Inner-10% stars fade and shorten, simulating depth.",
      "Zero-dependency \u2014 drops into any Flutter app.",
    ],
  },
  "Asteroids Game": {
    tagline: "Multiplayer Atari Asteroids \u2014 playable now",
    year: "2024",
    role: "Author",
    stack: ["JavaScript", "Canvas", "WebSockets", "Netlify"],
    overview: "A multiplayer reimagining of Atari Asteroids. Real-time sync between players, classic vector aesthetic, deployed on Netlify.",
    highlights: [
      "WebSocket sync for multiplayer state.",
      "Vector-style rendering on HTML Canvas \u2014 no sprites.",
      "Live, playable link below.",
    ],
  },
  "SmolLM Flutter": {
    tagline: "SmolLM, running inside a Flutter app",
    year: "2024",
    role: "Author",
    stack: ["Flutter", "SmolLM", "FFI"],
    overview: "A Flutter integration that runs SmolLM on-device \u2014 useful for privacy-preserving assistants that never phone home.",
    highlights: [
      "On-device inference \u2014 zero network calls at runtime.",
      "Works as a starting point for any local-LLM mobile app.",
    ],
  },
  "Heartline": {
    tagline: "Cardiovascular monitoring, reimagined",
    year: "2023",
    role: "Designer & developer",
    stack: ["Flutter", "Health APIs", "Figma"],
    overview: "A concept health app exploring how continuous cardiovascular data could be presented to non-clinical users without being scary or condescending.",
    highlights: [
      "Calm, minimal visual language \u2014 data without alarm fatigue.",
      "Onboarding designed for users with zero medical vocabulary.",
    ],
  },
  "Lucent": {
    tagline: "Product landing concept",
    year: "2024",
    role: "Designer & developer",
    stack: ["React", "Framer Motion", "Netlify"],
    overview: "A product landing concept with a heavy focus on motion and typography. Built as an exercise in taking a brand direction from zero to deployed in under a week.",
    highlights: [
      "Scroll-driven reveal animations.",
      "Deployed on Netlify with CI from GitHub.",
    ],
  },
  "awsxUTD-Hackathon": {
    tagline: "AWS \u00d7 UTD hackathon project",
    year: "2024",
    role: "Team member",
    stack: ["AWS", "Python", "React"],
    overview: "A hackathon entry for the AWS \u00d7 UTD event. Built under a tight clock with a team of four.",
    highlights: [
      "Deployed on AWS within the hackathon window.",
      "Demo video and pitch delivered same weekend.",
    ],
  },
  "awsxutd": {
    tagline: "AWS \u00d7 UTD club site",
    year: "2024",
    role: "Designer & developer",
    stack: ["React", "Netlify"],
    overview: "The public site for the AWS \u00d7 UTD student club. Built fast, iterated with the exec team, deployed on Netlify.",
    highlights: [
      "Event announcements and signup flow.",
      "Deployed on Netlify with continuous deploy from GitHub.",
    ],
  },
  "Open-API": {
    tagline: "Bridge your ChatGPT Plus session into a local API",
    year: "2023",
    role: "Author",
    stack: ["Chrome Extension", "Node.js", "Express", "ngrok"],
    overview: "A Chrome extension + Node server that exposes your logged-in ChatGPT session as a local HTTP API. Send messages from any app with a POST request.",
    highlights: [
      "Unique API key generated per install, stored locally.",
      "Works with ngrok to expose the local server to the internet.",
      "Keep-alive feature periodically activates the tab so the session doesn\u2019t idle out.",
    ],
    sections: [
      {
        heading: "The disclaimer",
        body: "Educational use only \u2014 this likely violates OpenAI\u2019s ToS, and depends on the current DOM of the ChatGPT web app, which can change overnight. Build accordingly.",
      },
    ],
  },
  "ArtScii": {
    tagline: "Image \u2192 ASCII art",
    year: "2023",
    role: "Author",
    stack: ["Python", "Pillow"],
    overview: "A compact tool that turns any image into ASCII art. Tweak the character ramp, output width, and contrast for different looks.",
    highlights: [
      "Configurable character ramp from dense to sparse.",
      "Luminance-based mapping for accurate shading.",
    ],
  },
  "ProKeys": {
    tagline: "Keyboard shortcut utility",
    year: "2023",
    role: "Author",
    stack: ["JavaScript", "Browser APIs"],
    overview: "A lightweight utility for power users \u2014 bind complex actions to keyboard shortcuts across the browser.",
  },
};
