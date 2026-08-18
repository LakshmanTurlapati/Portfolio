// src/data/tour-narration.ts
// Spoken narration variants for the voice-mode guided tour.
//
// The tool-call sequence (which projects open, scroll order, page jumps) lives
// in voice-controller.ts:startGuidedTour and is contract-locked by tests in
// tests/voice-barge-in.test.ts. This file only holds the spoken lines so
// repeat visitors hear slight variation across runs instead of an identical
// script. Each variant follows the same content beats — same projects in the
// same order, same tone, no defensive disclaimers about private data.

interface TourNarration {
  opener: string;
  reviewGateIntro: string;
  reviewGateMid: string;
  reviewGateClose: string;
  fsb: string;
  gitFly: string;
  parzAi: string;
  aboutIntro: string;
  experience: string;
  signoff: string;
}

// V1 mirrors the wording shipped in commit 989fa01 so existing visitors keep
// the same baseline experience. V2-V4 are slight rephrasings — same beats,
// different word choices.
export const TOUR_NARRATIONS: readonly TourNarration[] = [
  {
    opener:
      "Alright, here's the long version. This is not a static resume wall; it's the workbench version of the portfolio.",
    reviewGateIntro:
      "First stop: Review Gate. This one's very me: take a workflow that wastes requests, make the agent pause, and squeeze way more useful iteration out of the same session.",
    reviewGateMid:
      "The fun part is how practical it is: fewer dead-end AI sessions, more room to keep pushing inside the same request.",
    reviewGateClose:
      "The headline is simple: it turns the end of an AI coding request into a checkpoint instead of a dead stop. Less ceremony, more shipping.",
    fsb:
      "This is FSB, Full Self Browsing. It is the cleanest expression of the idea that AI control should feel tangible, bounded, and useful.",
    gitFly:
      "GitFly is the product-flavored side of the same obsession: AI-native dev workflows that feel current, fast, and practical. Live at gitfly.ai if you want to poke at it directly.",
    parzAi:
      "And here's the bot-thread: Parz-AI. This is the older assistant work that fed into the portfolio voice layer you're using right now.",
    aboutIntro:
      "Now the human page. The short version: full-stack roots, then the AI rabbit hole, then a lot of stubborn systems work until the demos became actual tools.",
    experience:
      "Current chapter: AI Enablement Engineer at InfiniteChoice, building Voyza as an AI-first hotel booking platform — where most of the day-to-day energy goes.",
    signoff:
      "That's the tour. If you want, interrupt me with any project name and I'll zoom into that instead.",
  },
  {
    opener:
      "Okay, here's the proper walkthrough. Not the resume highlight reel — this is the actual workbench.",
    reviewGateIntro:
      "Kicking off with Review Gate. Very me: take a workflow that bleeds requests, force the agent to pause, and pull a lot more iteration out of the same session.",
    reviewGateMid:
      "What makes it land is how practical it is — fewer dead-end AI sessions, way more room to keep pushing inside one request.",
    reviewGateClose:
      "Bottom line: it turns the end of an AI coding request into a checkpoint instead of a hard stop. Less ceremony, more shipping.",
    fsb:
      "Next up, FSB — Full Self Browsing. The clearest version of the idea that AI control should feel tangible, bounded, and useful.",
    gitFly:
      "GitFly is the product side of the same obsession: AI-native dev workflows that feel current, fast, and practical. Live at gitfly.ai if you want to try it yourself.",
    parzAi:
      "And the bot-thread: Parz-AI. Older assistant work that quietly grew into the voice layer you're talking to right now.",
    aboutIntro:
      "Onto the human page. Short version: full-stack roots, then deep into AI, then a lot of stubborn systems work until the demos turned into actual tools.",
    experience:
      "Right now: AI Enablement Engineer at InfiniteChoice, building Voyza as an AI-first hotel booking platform — most of the daily energy lives there.",
    signoff:
      "That's the run. If something caught your eye, name a project and I'll dive deeper into it.",
  },
  {
    opener:
      "Right, the long version. Less brochure, more live demo of how the work actually fits together.",
    reviewGateIntro:
      "Starting with Review Gate. Classic me: take a workflow that wastes requests, make the agent stop and breathe, and get way more iteration out of the same session.",
    reviewGateMid:
      "The practical bit is the point — fewer AI sessions hitting a wall, more space to keep moving inside one request.",
    reviewGateClose:
      "The whole headline: it turns the end of an AI coding request into a checkpoint, not a dead end. Less overhead, more output.",
    fsb:
      "This one is FSB — Full Self Browsing. The cleanest take on the idea that AI control should feel tangible, bounded, and useful.",
    gitFly:
      "GitFly is the product flavor of the same obsession: AI-native dev workflows that feel current, fast, and practical. It is live at gitfly.ai — easier to just try it.",
    parzAi:
      "Then there's the bot-thread: Parz-AI. Earlier assistant work that fed directly into the voice layer running this tour.",
    aboutIntro:
      "Hopping over to the human page. Short version: full-stack roots, then the AI rabbit hole, then a stretch of stubborn systems work until demos became real tools.",
    experience:
      "Currently: AI Enablement Engineer at InfiniteChoice, building Voyza, an AI-first hotel booking platform — that's where the day-to-day energy goes.",
    signoff:
      "That's the loop. Cut in with any project name and I'll go deeper on it.",
  },
  {
    opener:
      "Let me give you the guided look. Skipping the resume gloss — this is the working version of the portfolio.",
    reviewGateIntro:
      "First stop, Review Gate. Very on-brand for me: spot a workflow that bleeds requests, make the agent pause, and pull way more iteration out of one session.",
    reviewGateMid:
      "What I like about it is how practical it is — fewer dead-end AI sessions, more room to keep pushing within the same request.",
    reviewGateClose:
      "Simply put: it converts the end of an AI coding request into a checkpoint, not a stop. Less friction, more shipping.",
    fsb:
      "Now FSB — Full Self Browsing. The clearest expression of the idea that AI control should feel tangible, bounded, and useful.",
    gitFly:
      "GitFly is the product side of the same obsession: AI-native dev workflows that feel current, fast, and practical. It is live at gitfly.ai if you want to poke at it directly.",
    parzAi:
      "Then the bot-thread: Parz-AI. The older assistant work that quietly turned into the voice layer running this tour.",
    aboutIntro:
      "Over to the human page. Short version: full-stack roots, then the AI rabbit hole, then a lot of stubborn systems work until the demos became actual tools.",
    experience:
      "Right now: AI Enablement Engineer at InfiniteChoice, building Voyza as an AI-first hotel booking platform — that's where most of the daily energy goes.",
    signoff:
      "That's the tour. Hop in with any project name and I'll zoom into it.",
  },
];

export function pickTourNarration(): TourNarration {
  const idx = Math.floor(Math.random() * TOUR_NARRATIONS.length);
  return TOUR_NARRATIONS[idx];
}
