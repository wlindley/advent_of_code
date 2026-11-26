import { describe, expect, it } from 'vitest';
import {
  MAX_PASSWORD,
  MIN_PASSWORD,
  PASSWORD_LENGTH,
  PasswordAnalysis,
  analyzePassword,
  assertSixDigitPassword,
  ceilNonDecreasing,
  extractDigits,
  nextNonDecreasing,
} from './candidate';

describe('candidate helpers', () => {
  it('exposes six-digit bounds constants', () => {
    expect(MIN_PASSWORD).toBe(100_000);
    expect(MAX_PASSWORD).toBe(999_999);
    expect(PASSWORD_LENGTH).toBe(6);
  });

  it('validates six-digit integer passwords', () => {
    expect(() => assertSixDigitPassword(100_000)).not.toThrow();
    expect(() => assertSixDigitPassword(999_999)).not.toThrow();
    expect(() => assertSixDigitPassword(99_999)).toThrow(RangeError);
    expect(() => assertSixDigitPassword(1_000_000)).toThrow(RangeError);
    expect(() => assertSixDigitPassword(123_456.5)).toThrow(RangeError);
    expect(() => assertSixDigitPassword(Number.NaN)).toThrow(RangeError);
  });

  it('extracts frozen 6-digit tuples', () => {
    const digits = extractDigits(123_456);
    expect(digits).toEqual([1, 2, 3, 4, 5, 6]);
    expect(Object.isFrozen(digits)).toBe(true);
    expect(() => extractDigits(99_999)).toThrow(RangeError);
  });

  it('computes ceiling non-decreasing passwords by clamping all trailing digits', () => {
    expect(ceilNonDecreasing(111_111)).toBe(111_111);
    expect(ceilNonDecreasing(123_456)).toBe(123_456);
    expect(ceilNonDecreasing(999_999)).toBe(999_999);
    expect(ceilNonDecreasing(123_199)).toBe(123_333);
    expect(ceilNonDecreasing(223_450)).toBe(223_455);
    expect(ceilNonDecreasing(100_000)).toBe(111_111);
    expect(ceilNonDecreasing(543_210)).toBe(555_555);
    expect(() => ceilNonDecreasing(99_999)).toThrow(RangeError);
  });

  it('advances to the next non-decreasing password or returns null at max', () => {
    expect(nextNonDecreasing(123_444)).toBe(123_445);
    expect(nextNonDecreasing(123_399)).toBe(123_444);
    expect(nextNonDecreasing(199_999)).toBe(222_222);
    expect(nextNonDecreasing(999_998)).toBe(999_999);
    expect(nextNonDecreasing(999_999)).toBeNull();
    expect(() => nextNonDecreasing(1_000_000)).toThrow(RangeError);
  });

  it('analyzes digit runs and derives monotonicity and max run length dynamically', () => {
    const mono = analyzePassword(111_234);
    expect(Object.isFrozen(mono)).toBe(true);
    expect(Object.isFrozen(mono.digits)).toBe(true);
    expect(Object.isFrozen(mono.runs)).toBe(true);
    expect(Object.isFrozen(mono.runs[0])).toBe(true);
    expect(mono.value).toBe(111_234);
    expect(mono.runs).toEqual([
      { digit: 1, startIndex: 0, length: 3 },
      { digit: 2, startIndex: 3, length: 1 },
      { digit: 3, startIndex: 4, length: 1 },
      { digit: 4, startIndex: 5, length: 1 },
    ]);
    expect(mono.isNonDecreasing).toBe(true);
    expect(mono.maxRunLength).toBe(3);

    const decreasing = analyzePassword(223_450);
    expect(decreasing.isNonDecreasing).toBe(false);
    expect(decreasing.maxRunLength).toBe(2);

    const emptyRuns = new PasswordAnalysis(123_456, [1, 2, 3, 4, 5, 6], []);
    expect(emptyRuns.maxRunLength).toBe(0);
  });
});
