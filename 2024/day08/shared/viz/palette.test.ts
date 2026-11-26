import { describe, expect, it } from 'vitest';
import { frequencyColor } from './palette';

const ALL_FREQUENCIES = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');

describe('frequencyColor', () => {
  it('returns deterministic, distinct colors for all 62 frequency characters', () => {
    const colors = ALL_FREQUENCIES.map((ch) => frequencyColor(ch));
    expect(new Set(colors).size).toBe(62);
    for (const ch of ALL_FREQUENCIES) {
      expect(frequencyColor(ch)).toBe(frequencyColor(ch));
      expect(frequencyColor(ch)).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/);
    }
  });

  it('separates uppercase and lowercase frequencies of the same letter', () => {
    for (let i = 0; i < 26; i += 1) {
      const upper = String.fromCharCode(65 + i);
      const lower = String.fromCharCode(97 + i);
      expect(frequencyColor(upper)).not.toBe(frequencyColor(lower));
    }
  });

  it('returns a safe fallback color for non-alphanumeric symbols', () => {
    expect(frequencyColor('.')).toBe('var(--muted)');
    expect(frequencyColor('#')).toBe('var(--muted)');
  });
});
