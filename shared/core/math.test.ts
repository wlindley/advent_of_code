import { describe, expect, it } from 'vitest';
import { bigintIsqrt, bigintLog2, euclideanMod } from './index';

describe('euclideanMod', () => {
  it('computes non-negative remainders for positive and zero dividends', () => {
    expect(euclideanMod(7, 5)).toBe(2);
    expect(euclideanMod(10, 5)).toBe(0);
    expect(Object.is(euclideanMod(0, 100), 0)).toBe(true);
  });

  it('wraps negative dividends into [0, divisor) and normalizes -0 to +0', () => {
    expect(euclideanMod(-1, 100)).toBe(99);
    expect(euclideanMod(-18, 100)).toBe(82);
    expect(euclideanMod(-205, 100)).toBe(95);
    const exactMultiple = euclideanMod(-100, 100);
    expect(exactMultiple).toBe(0);
    expect(Object.is(exactMultiple, 0)).toBe(true);
  });

  it('rejects non-safe-integer dividends', () => {
    expect(() => euclideanMod(1.5, 10)).toThrow(RangeError);
    expect(() => euclideanMod(Number.NaN, 10)).toThrow(RangeError);
    expect(() => euclideanMod(Number.POSITIVE_INFINITY, 10)).toThrow(RangeError);
    expect(() => euclideanMod(Number.MAX_SAFE_INTEGER + 1, 10)).toThrow(RangeError);
  });

  it('rejects non-positive or non-safe-integer divisors', () => {
    expect(() => euclideanMod(5, 0)).toThrow(RangeError);
    expect(() => euclideanMod(5, -3)).toThrow(RangeError);
    expect(() => euclideanMod(5, 2.5)).toThrow(RangeError);
    expect(() => euclideanMod(5, Number.MAX_SAFE_INTEGER + 1)).toThrow(RangeError);
  });
});

describe('bigintLog2', () => {
  it('computes accurate base-2 logs across small and >2^1024 values', () => {
    expect(bigintLog2(1n)).toBe(0);
    expect(bigintLog2(8n)).toBe(3);
    expect(bigintLog2(1n << 1200n)).toBe(1200);
    expect(bigintLog2(3n << 1200n)).toBeCloseTo(1200 + Math.log2(3), 10);
  });

  it('rejects non-positive BigInts', () => {
    expect(() => bigintLog2(0n)).toThrow(RangeError);
    expect(() => bigintLog2(-4n)).toThrow(RangeError);
  });
});

describe('bigintIsqrt', () => {
  it('computes exact floor square roots for 0..16', () => {
    const expected = [0n, 1n, 1n, 1n, 2n, 2n, 2n, 2n, 2n, 3n, 3n, 3n, 3n, 3n, 3n, 3n, 4n];
    for (let i = 0; i < expected.length; i += 1) {
      expect(bigintIsqrt(BigInt(i))).toBe(expected[i]);
    }
  });

  it('handles k^2 - 1, k^2, and k^2 + 1 across large and >2^1024 scales', () => {
    const bases = [10n ** 9n, 2n ** 64n, 10n ** 18n, 1n << 600n];
    for (const k of bases) {
      const sq = k * k;
      expect(bigintIsqrt(sq - 1n)).toBe(k - 1n);
      expect(bigintIsqrt(sq)).toBe(k);
      expect(bigintIsqrt(sq + 1n)).toBe(k);
    }
  });

  it('rejects negative BigInts with RangeError', () => {
    expect(() => bigintIsqrt(-1n)).toThrow(RangeError);
    expect(() => bigintIsqrt(-(10n ** 20n))).toThrow(RangeError);
  });
});
