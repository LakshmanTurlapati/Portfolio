// src/lib/voice-commands.ts
// Per D-15: matchNavIntent regex router (ported from voice_mode.jsx lines 354-362)
// Per D-20: TOUR_STEPS array (from VOICE_HANDOFF.md section 4)
// No 'use client' — pure TypeScript utility, no React imports.

export interface NavIntent {
  page: 'home' | 'portfolio' | 'about';
  say: string;
}

export interface TourStep {
  page: 'home' | 'portfolio' | 'about';
  say: string;
  highlight?: string;
  call?: [string, Record<string, unknown>];
}

// Port verbatim from voice_mode.jsx lines 354-362
export function matchNavIntent(u: string): NavIntent | null {
  if (/(open|show|take me to|go to)\s+(the\s+)?portfolio|show\s+(me\s+)?(your\s+)?work|projects page/.test(u))
    return { page: 'portfolio', say: 'Opening the portfolio.' };
  if (/(open|show|take me to|go to)\s+(the\s+)?about(\s+page)?|about page/.test(u))
    return { page: 'about', say: "Here's the about page." };
  if (/(go|take me)\s+(to\s+)?home|go back|back home|main page|landing page/.test(u))
    return { page: 'home', say: 'Back home.' };
  return null;
}

// Port from VOICE_HANDOFF.md section 4 (per D-20)
export const TOUR_STEPS: TourStep[] = [
  { page: 'home',      say: "This is the landing. I'm Lakshman's digital twin — ask me anything.", highlight: '.hero' },
  { page: 'home',      say: "Those floating particles? They react when I'm thinking.", highlight: '#pf-particles' },
  { page: 'portfolio', say: "Here's the portfolio — projects across AI, Flutter, and web.", highlight: '.portfolio-grid' },
  { page: 'portfolio', say: "Parz-AI is my favorite — a self-hostable LLM persona.", call: ['openProject', { slug: 'Parz-AI' }] },
  { page: 'about',     say: "And the about page if you want the human version.", call: ['navigate', { page: 'about' }] },
];

// Tour trigger detection
export function isTourIntent(u: string): boolean {
  return /give me a tour|show me around|take me on a tour|start\s+(the\s+)?tour/.test(u);
}

// Stop/exit intent
export function isStopIntent(u: string): boolean {
  return /^(stop|shut up|quiet|cancel|exit|close|bye)/.test(u);
}

// Text mode switch intent (per D-16)
export function isTextModeIntent(u: string): boolean {
  return /switch to (text|chat)|text mode|open chat|type instead/.test(u);
}
