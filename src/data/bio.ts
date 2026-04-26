export interface BioSegment {
  text: string;
  bold?: boolean;
}

export const bioSegments: BioSegment[] = [
  { text: "I'm an " },
  { text: "AI builder", bold: true },
  { text: ", " },
  { text: "open-source builder", bold: true },
  { text: ", and creative technologist who started in " },
  { text: "full-stack engineering", bold: true },
  { text: " and kept getting pulled deeper into " },
  { text: "Artificial Intelligence", bold: true },
  { text: ". The throughline is simple: I like finding the gap between what exists and what could exist, then building until the thing in my head becomes real. That alignment/gap-radar instinct is probably the best explanation for why I get intense about work.\n\n" },
  { text: "Right now, I'm an " },
  { text: "AI Enablement Engineer", bold: true },
  { text: " at " },
  { text: "InfiniteChoice", bold: true },
  { text: ", building " },
  { text: "Voyza", bold: true },
  { text: ", an AI-first hotel booking platform. I keep that story public-safe because the interesting part for this portfolio is the direction: practical AI systems that help people move faster, not private employer internals.\n\n" },
  { text: "My current flagship projects are " },
  { text: "FSB / Full Self Browsing", bold: true },
  { text: " and " },
  { text: "GitFly", bold: true },
  { text: ". FSB is me exploring what browser control feels like when an AI can visibly operate the web for you. GitFly lives at " },
  { text: "https://gitfly.ai", bold: true },
  { text: " as a public product, while the source and private implementation details stay private.\n\n" },
  { text: "Before that, " },
  { text: "Review Gate", bold: true },
  { text: " became the project that proved this obsession loop can turn into something useful for other builders too: a Cursor workflow that stops agents from ending too early and keeps review inside the same request. It hit real open-source traction and sharpened how I think about AI tools, developer experience, and shipping fast without shipping shallow.\n\n" },
  { text: "I'm still grateful for the whole arc: UT Dallas, AWS Cloud Captain, the full-stack years, the AI rabbit holes, and the weird aesthetic taste that makes me care about how things feel. The goal now is to keep building ambitious, useful, slightly-peculiar AI products with warmth, speed, and taste." },
];
