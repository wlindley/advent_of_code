import { describe, expect, it } from 'vitest';
import { SpelledDigitExtractor, spelledDigitExtractor } from './index';

const WORDS: readonly (readonly [string, number])[] = [
  ['one', 1],
  ['two', 2],
  ['three', 3],
  ['four', 4],
  ['five', 5],
  ['six', 6],
  ['seven', 7],
  ['eight', 8],
  ['nine', 9],
];

describe('SpelledDigitExtractor', () => {
  it('matches ASCII 0..9 and rejects adjacent boundary characters / and :', () => {
    const extractor = new SpelledDigitExtractor();
    expect(extractor.matchAt('/09:', 0)).toBeNull();
    expect(extractor.matchAt('/09:', 1)).toMatchObject({ value: 0, start: 1, length: 1, end: 2 });
    expect(extractor.matchAt('/09:', 2)).toMatchObject({ value: 9, start: 2, length: 1, end: 3 });
    expect(extractor.matchAt('/09:', 3)).toBeNull();
  });

  it('matches all nine spelled words at offset 0 and non-zero offsets', () => {
    for (const [word, value] of WORDS) {
      expect(spelledDigitExtractor.matchAt(word, 0)).toMatchObject({
        value,
        start: 0,
        length: word.length,
        end: word.length,
      });
      const padded = `xx${word}yy`;
      expect(spelledDigitExtractor.matchAt(padded, 2)).toMatchObject({
        value,
        start: 2,
        length: word.length,
        end: 2 + word.length,
      });
    }
  });

  it('handles multi-entry buckets (t, f, s) hits and misses', () => {
    expect(spelledDigitExtractor.matchAt('two', 0)?.value).toBe(2);
    expect(spelledDigitExtractor.matchAt('three', 0)?.value).toBe(3);
    expect(spelledDigitExtractor.matchAt('ten', 0)).toBeNull();

    expect(spelledDigitExtractor.matchAt('four', 0)?.value).toBe(4);
    expect(spelledDigitExtractor.matchAt('five', 0)?.value).toBe(5);
    expect(spelledDigitExtractor.matchAt('foo', 0)).toBeNull();

    expect(spelledDigitExtractor.matchAt('six', 0)?.value).toBe(6);
    expect(spelledDigitExtractor.matchAt('seven', 0)?.value).toBe(7);
    expect(spelledDigitExtractor.matchAt('sun', 0)).toBeNull();
  });

  it('rejects zero, uppercase words, unbucketed letters, and truncated words at EOF', () => {
    expect(spelledDigitExtractor.matchAt('zero', 0)).toBeNull();
    expect(spelledDigitExtractor.matchAt('ONE', 0)).toBeNull();
    expect(spelledDigitExtractor.matchAt('Two', 0)).toBeNull();
    expect(spelledDigitExtractor.matchAt('abc', 0)).toBeNull();

    for (const truncated of ['on', 'tw', 'thre', 'fou', 'fiv', 'si', 'seve', 'eigh', 'nin']) {
      expect(spelledDigitExtractor.matchAt(truncated, 0)).toBeNull();
    }
  });

  it('returns null for invalid indices and exposes a frozen singleton', () => {
    expect(spelledDigitExtractor.matchAt('', 0)).toBeNull();
    expect(spelledDigitExtractor.matchAt('one', -1)).toBeNull();
    expect(spelledDigitExtractor.matchAt('one', 3)).toBeNull();
    expect(spelledDigitExtractor.matchAt('one', 0.5)).toBeNull();
    expect(spelledDigitExtractor.matchAt('one', Number.NaN)).toBeNull();
    expect(Object.isFrozen(spelledDigitExtractor)).toBe(true);
  });
});
