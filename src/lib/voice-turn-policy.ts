import { tokenizeSpeechWords } from './voice-caption-window';

export type VoiceTurnKind = 'user' | 'greet';

export const VOICE_BARGE_IN_MIN_WORDS = 3;
export const VOICE_OPEN_GREETING_DELAY_MS = 480;

export function buildVoiceOpeningPrompt(page = 'home'): string {
  const safePage = /^[a-z0-9-]+$/i.test(page) ? page : 'home';
  return `[Voice mode just opened on the ${safePage} page. Greet briefly in Parz's voice, then leave room for the user to respond. Voice channel: no markdown, no lists, no emoji.]`;
}

export function shouldPersistVoiceTurn(kind: VoiceTurnKind): boolean {
  return kind === 'user';
}

export function normalizeSpeechForEchoCheck(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function looksLikeCurrentSpeechEcho(candidate: string, currentSpeech: string): boolean {
  const normalizedCandidate = normalizeSpeechForEchoCheck(candidate);
  const normalizedSpeech = normalizeSpeechForEchoCheck(currentSpeech);
  if (!normalizedCandidate || !normalizedSpeech) return false;
  return normalizedSpeech.includes(normalizedCandidate);
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
