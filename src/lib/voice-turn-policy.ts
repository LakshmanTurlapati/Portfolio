import { tokenizeSpeechWords } from './voice-caption-window';

export type VoiceTurnKind = 'user' | 'greet';

export const VOICE_BARGE_IN_MIN_WORDS = 3;
export const VOICE_MOBILE_BARGE_IN_MIN_WORDS = 4;
export const VOICE_MOBILE_INTERIM_BARGE_IN_MIN_WORDS = 5;
export const VOICE_OPEN_GREETING_DELAY_MS = 480;

export function buildVoiceOpeningPrompt(page = 'home'): string {
  const safePage = /^[a-z0-9-]+$/i.test(page) ? page : 'home';
  return `[Voice mode just opened on the ${safePage} page. Greet briefly in Parz's voice, then leave room for the user to respond. Voice channel: no markdown, no lists, no emoji.]`;
}

export function shouldPersistVoiceTurn(kind: VoiceTurnKind): boolean {
  return kind === 'user';
}

export function isExplicitTourIntent(text: string): boolean {
  const normalized = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) return false;
  if (/\b(start|begin|give|take|run)\s+(me\s+)?((a|the)\s+)?(guided\s+)?tour\b/.test(normalized)) return true;
  if (/\b(tour|walkthrough|walk-through)\s+(the\s+)?(site|portfolio|projects?)\b/.test(normalized)) return true;
  if (/\bwalk\s+me\s+through\s+(the\s+)?(site|portfolio|projects?)\b/.test(normalized)) return true;
  if (/\bshow\s+me\s+around\b/.test(normalized)) return true;
  if (/\bshowcase\s+(the\s+)?(site|portfolio|projects?)\b/.test(normalized)) return true;
  return false;
}

export function normalizeSpeechForEchoCheck(text: string): string {
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

export interface VoiceToolCall {
  name: string;
  args: Record<string, unknown>;
}

// Why: post-tour, Grok occasionally drops narration and returns only tool calls.
// Without spoken output the state machine flips idle → listening, the user hears
// nothing, and the tour-end handoff appears to loop listening ↔ thinking forever.
// Speaking a brief tool-derived line breaks that silent loop and confirms the
// action audibly. startTour / switchToText / endCall are intentionally omitted —
// they are either gated upstream (isExplicitTourIntent) or short-circuit the
// turn before this fallback runs.
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
