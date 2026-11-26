import { describe, expect, it } from 'vitest';
import { bigintIsqrt } from './math';

describe('bigintIsqrt', () => {
  it('throws RangeError for negative input', () => {
    expect(() => bigintIsqrt(-1n)).toThrow(RangeError);
  });

  it('computes exact floor square roots for 0..16', () => {
    const expected = [0n, 1n, 1n, 1n, 2n, 2n, 2n, 2n, 2n, 3n, 3n, 3n, 3n, 3n, 3n, 3n, 4n];
    for (let i = 0; i < expected.length; i += 1) {
      expect(bigintIsqrt(BigInt(i))).toBe(expected[i]);
    }
  });

  it('handles k^2 - 1, k^2, and k^2 + 1 across large scales', () => {
    const bases = [10n ** 9n, 2n ** 64n, 10n ** 18n];
    for (const k of bases) {
      const sq = k * k;
      expect(bigintIsqrt(sq - 1n)).toBe(k - 1n);
      expect(bigintIsqrt(sq)).toBe(k);
      expect(bigintIsqrt(sq + 1n)).toBe(k);
    }
  });
});
