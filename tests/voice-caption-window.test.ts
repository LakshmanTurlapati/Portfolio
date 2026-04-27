import { describe, expect, it } from 'vitest';
import {
  spokenCaptionWindow,
  tokenizeSpeechWords,
  wordIndexFromCharIndex,
} from '@/lib/voice-caption-window';

describe('voice caption window', () => {
  it('returns empty text for empty speech', () => {
    expect(tokenizeSpeechWords('   ')).toEqual([]);
    expect(spokenCaptionWindow('', 0)).toBe('');
  });

  it('keeps short speech fully visible', () => {
    expect(spokenCaptionWindow('short answer here', 2, 7)).toBe('short answer here');
  });

  it('returns the latest spoken word window for long speech', () => {
    const text = 'one two three four five six seven eight nine ten';
    expect(spokenCaptionWindow(text, 9, 5)).toBe('six seven eight nine ten');
  });

  it('keeps punctuation attached to words', () => {
    const text = 'Okay, this is tighter, cleaner, and easier to follow.';
    expect(spokenCaptionWindow(text, 8, 4)).toBe('and easier to follow.');
  });

  it('maps speech synthesis char indexes to word indexes', () => {
    expect(wordIndexFromCharIndex('hello world again', 0)).toBe(0);
    expect(wordIndexFromCharIndex('hello world again', 8)).toBe(1);
    expect(wordIndexFromCharIndex('hello world again', 14)).toBe(2);
  });
});
