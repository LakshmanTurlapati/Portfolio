import { tokenizeSpeechWords } from './voice-caption-window';

export type VoiceTurnKind = 'user' | 'greet';

export const VOICE_BARGE_IN_MIN_WORDS = 3;
export const VOICE_MOBILE_BARGE_IN_MIN_WORDS = 4;
export const VOICE_MOBILE_INTERIM_BARGE_IN_MIN_WORDS = 5;
export const VOICE_OPEN_GREETING_DELAY_MS = 480;

export function buildVoiceOpeningPrompt(page = 'home'): string {
  const safePage = /^[a-z0-9-]+$/i.test(page) ? page : 'home';
  // Why: the prior wording ("Voice mode just opened on the X page") leaked
  // into the model's reply — greetings echoed "voice mode is active" almost every
  // turn. Phrase this as an ambient cue with explicit no-announce guardrails
  // so the opening line sounds nonchalant, like picking up a conversation
  // rather than booting a feature.
  return `[Cue: user is on the ${safePage} page; their mic is live. Reply with one short casual line in Parz's voice — like picking up mid-conversation, never an announcement. Do not narrate or describe any state, mode, channel, activation, or that anything just started. Output style: no markdown, no lists, no emoji — spoken prose only.]`;
}

export function shouldPersistVoiceTurn(kind: VoiceTurnKind): boolean {
  return kind === 'user';
}

function normalizeSpeechForEchoCheck(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenizeNormalizedSpeech(text: string): string[] {
  const normalized = normalizeSpeechForEchoCheck(text);
  return normalized ? normalized.split(' ') : [];
}

function countOrderedTokenMatches(candidateTokens: string[], speechTokens: string[]): number {
  let speechIndex = 0;
  let matches = 0;

  for (const candidateToken of candidateTokens) {
    while (speechIndex < speechTokens.length) {
      if (speechTokens[speechIndex] === candidateToken) {
        matches += 1;
        speechIndex += 1;
        break;
      }
      speechIndex += 1;
    }
  }

  return matches;
}

export function looksLikeCurrentSpeechEcho(candidate: string, currentSpeech: string): boolean {
  const normalizedCandidate = normalizeSpeechForEchoCheck(candidate);
  const normalizedSpeech = normalizeSpeechForEchoCheck(currentSpeech);
  if (!normalizedCandidate || !normalizedSpeech) return false;
  if (normalizedSpeech.includes(normalizedCandidate)) return true;

  const candidateTokens = tokenizeNormalizedSpeech(candidate);
  const speechTokens = tokenizeNormalizedSpeech(currentSpeech);
  if (candidateTokens.length < VOICE_BARGE_IN_MIN_WORDS || speechTokens.length === 0) return false;

  const orderedMatches = countOrderedTokenMatches(candidateTokens, speechTokens);
  return orderedMatches >= VOICE_BARGE_IN_MIN_WORDS && orderedMatches / candidateTokens.length >= 0.72;
}

export function isIntentionalBargeInTranscript(
  transcript: string,
  currentSpeech: string,
  minWords = VOICE_BARGE_IN_MIN_WORDS,
): boolean {
  return (
    tokenizeSpeechWords(transcript).length >= minWords &&
    !looksLikeCurrentSpeechEcho(transcript, currentSpeech)
  );
}

export function isMobileIntentionalBargeInTranscript(
  transcript: string,
  currentSpeech: string,
  isFinalTranscript: boolean,
): boolean {
  const minWords = isFinalTranscript
    ? VOICE_MOBILE_BARGE_IN_MIN_WORDS
    : VOICE_MOBILE_INTERIM_BARGE_IN_MIN_WORDS;

  return isIntentionalBargeInTranscript(transcript, currentSpeech, minWords);
}

// Server `/api/tts` accepts up to 4000 chars per request; keep client chunks
// safely under that so an off-by-one or a comma-heavy stretch never bumps
// against the cap. Brief voice turns usually fit in a single chunk; only true
// overflow gets split.
export const VOICE_TTS_CHUNK_MAX_CHARS = 3500;

const VOICE_TTS_SENTENCE_BOUNDARIES = ['. ', '! ', '? ', '.\n', '!\n', '?\n'];
const VOICE_TTS_CLAUSE_BOUNDARIES = [', ', '; ', ': '];
const VOICE_TTS_MIN_BREAK_RATIO = 0.4;

function lastIndexOfAny(
  haystack: string,
  needles: readonly string[],
): { index: number; length: number } {
  let bestIndex = -1;
  let bestLen = 0;
  for (const needle of needles) {
    const idx = haystack.lastIndexOf(needle);
    if (idx > bestIndex) {
      bestIndex = idx;
      bestLen = needle.length;
    }
  }
  return { index: bestIndex, length: bestLen };
}

// Why: ElevenLabs (and our /api/tts proxy) refuse very long single requests.
// Without splitting, long model answers used to throw 413 and fall back to the
// OS SpeechSynthesis voice — the robotic-voice regression. Split at the most
// natural boundary that still keeps each chunk under maxChars: sentence end
// first, then clause punctuation, then whitespace, then a hard cut as a last
// resort. Splits inside the first 40% of a chunk are rejected so we don't
// emit a 5-word chunk followed by a 3000-char chunk.
export function chunkForTTS(
  text: string,
  maxChars: number = VOICE_TTS_CHUNK_MAX_CHARS,
): string[] {
  if (maxChars < 1) throw new RangeError('maxChars must be at least 1');
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.length <= maxChars) return [trimmed];

  const minBreak = Math.max(1, Math.floor(maxChars * VOICE_TTS_MIN_BREAK_RATIO));
  const chunks: string[] = [];
  let remaining = trimmed;

  while (remaining.length > maxChars) {
    const window = remaining.slice(0, maxChars);

    let breakAt = maxChars;
    const sentence = lastIndexOfAny(window, VOICE_TTS_SENTENCE_BOUNDARIES);
    if (sentence.index >= minBreak) {
      breakAt = sentence.index + sentence.length;
    } else {
      const clause = lastIndexOfAny(window, VOICE_TTS_CLAUSE_BOUNDARIES);
      if (clause.index >= minBreak) {
        breakAt = clause.index + clause.length;
      } else {
        const spaceIdx = window.lastIndexOf(' ');
        if (spaceIdx > 0) breakAt = spaceIdx + 1;
      }
    }

    if (breakAt < 1) breakAt = maxChars;

    const piece = remaining.slice(0, breakAt).trim();
    if (piece) chunks.push(piece);
    const next = remaining.slice(breakAt).trim();
    // Defensive: if breakAt didn't advance, force progress to avoid an infinite loop.
    remaining = next.length < remaining.length ? next : '';
  }

  if (remaining) chunks.push(remaining);
  return chunks;
}

interface VoiceToolCall {
  name: string;
  args: Record<string, unknown>;
}

// Why: the model can occasionally drop narration and return only tool calls.
// Without spoken output the state machine flips idle → listening, the user hears
// nothing, and the tour-end handoff appears to loop listening ↔ thinking forever.
// Speaking a brief tool-derived line breaks that silent loop and confirms the
// action audibly. startTour / switchToText / endCall are intentionally omitted —
// they short-circuit the turn before this fallback runs.
export function buildToolFallbackSpeech(toolCalls: readonly VoiceToolCall[]): string {
  for (const tc of toolCalls) {
    const args = (tc.args ?? {}) as Record<string, unknown>;
    switch (tc.name) {
      case 'openProject': {
        const raw = args.name ?? args.slug;
        const name = typeof raw === 'string' ? raw.trim() : '';
        return name ? `Opening ${name}.` : 'Opening that project.';
      }
      case 'navigate': {
        const raw = args.page;
        const page = typeof raw === 'string' ? raw.trim() : '';
        return page ? `Heading to the ${page} page.` : 'Switching pages.';
      }
      case 'scrollTo': {
        const raw = args.section ?? args.selector;
        const section = typeof raw === 'string' ? raw.trim() : '';
        return section ? `Taking you to ${section}.` : 'Scrolling there.';
      }
      case 'scrollProjectPreview':
        return 'Showing more of this project.';
      case 'closeBrowser':
        return 'Closing the browser view.';
      case 'openCurrentProjectExternal':
        return 'Opening it in a new tab.';
      case 'toggleTheme':
        return 'Switching the theme.';
      case 'openLink':
        return 'Opening that link.';
      case 'unsupportedIframeControl':
        return "I can move around the portfolio, but I can't operate that embedded site directly.";
      default:
        continue;
    }
  }
  return '';
}
