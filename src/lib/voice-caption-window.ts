export function tokenizeSpeechWords(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

export function spokenCaptionWindow(
  wordsOrText: readonly string[] | string,
  activeWordIndex: number,
  windowSize = 7,
): string {
  const words = typeof wordsOrText === 'string'
    ? tokenizeSpeechWords(wordsOrText)
    : [...wordsOrText];
  if (words.length === 0) return '';
  if (words.length <= windowSize) return words.join(' ');

  const clampedIndex = Math.min(words.length - 1, Math.max(0, activeWordIndex));
  const end = clampedIndex + 1;
  const start = Math.max(0, end - windowSize);
  return words.slice(start, end).join(' ');
}

export function wordIndexFromCharIndex(text: string, charIndex: number): number {
  const safeIndex = Math.min(text.length, Math.max(0, charIndex + 1));
  return Math.max(0, tokenizeSpeechWords(text.slice(0, safeIndex)).length - 1);
}
