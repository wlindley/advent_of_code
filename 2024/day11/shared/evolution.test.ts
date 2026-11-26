import { describe, expect, it } from 'vitest';
import {
  countStonesAfterBlinks,
  parsePebbleLine,
  PebbleLine,
  resolveTransition,
  stepHistogram,
  sumHistogram,
  validateBlinkCount,
  type StoneTransition,
} from './index';

describe('validateBlinkCount', () => {
  it('accepts zero and positive integers', () => {
    expect(validateBlinkCount(0)).toBe(0);
    expect(validateBlinkCount(25)).toBe(25);
  });

  it('rejects negative, fractional, NaN, and infinite values', () => {
    expect(() => validateBlinkCount(-1)).toThrow(RangeError);
    expect(() => validateBlinkCount(1.5)).toThrow(RangeError);
    expect(() => validateBlinkCount(Number.NaN)).toThrow(RangeError);
    expect(() => validateBlinkCount(Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });
});

describe('resolveTransition & stepHistogram', () => {
  it('caches computed transitions across repeated lookups', () => {
    const cache = new Map<bigint, StoneTransition>();
    const first = resolveTransition(10n, cache);
    const second = resolveTransition(10n, cache);
    expect(first).toBe(second);
    expect(cache.size).toBe(1);
  });

  it('steps histogram and tracks ruleCounts for 0 1 10 99 999', () => {
    const line = parsePebbleLine('0 1 10 99 999');
    const cache = new Map<bigint, StoneTransition>();
    const step = stepHistogram(line.toHistogram(), cache);

    expect(step.ruleCounts).toEqual({ zero: 1n, split: 2n, scale: 2n });
    expect(Object.isFrozen(step)).toBe(true);
    expect(Object.isFrozen(step.ruleCounts)).toBe(true);
    expect(step.next.get(1n)).toBe(2n); // from 0 -> 1 and 10 -> [1, 0]
    expect(step.next.get(2024n)).toBe(1n);
    expect(step.next.get(0n)).toBe(1n);
    expect(step.next.get(9n)).toBe(2n);
    expect(step.next.get(2021976n)).toBe(1n);
    expect(sumHistogram(step.next)).toBe(7n);
  });
});

describe('countStonesAfterBlinks', () => {
  it('returns initial stone count when blinkCount is 0', () => {
    const line = parsePebbleLine('125 17 17');
    expect(countStonesAfterBlinks(line, 0)).toBe(3n);
  });

  it('matches AoC 0 1 10 99 999 example after 1 blink (7 stones)', () => {
    expect(countStonesAfterBlinks(parsePebbleLine('0 1 10 99 999'), 1)).toBe(7n);
  });

  it('matches AoC 125 17 example for blinks 1..6 and 25', () => {
    const line = parsePebbleLine('125 17');
    const expectedFirstSix = [3n, 4n, 5n, 9n, 13n, 22n];
    expectedFirstSix.forEach((expected, idx) => {
      expect(countStonesAfterBlinks(line, idx + 1)).toBe(expected);
    });
    expect(countStonesAfterBlinks(line, 25)).toBe(55312n);
  });

  it('preserves linearity with duplicate initial stones', () => {
    const single = countStonesAfterBlinks(new PebbleLine([125n]), 15);
    const triple = countStonesAfterBlinks(new PebbleLine([125n, 125n, 125n]), 15);
    expect(triple).toBe(single * 3n);
  });

  it('rejects invalid blinkCount', () => {
    expect(() => countStonesAfterBlinks(new PebbleLine([0n]), -2)).toThrow(RangeError);
  });
});
