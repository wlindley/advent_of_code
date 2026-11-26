import { describe, expect, it } from 'vitest';
import { extGcdBigInt, solveCongruences, type Congruence } from './index';

describe('extGcdBigInt', () => {
  it('computes Bezout identities for coprime, non-coprime, zero, and negative inputs', () => {
    const cases: readonly [bigint, bigint, bigint][] = [
      [17n, 13n, 1n],
      [12n, 8n, 4n],
      [0n, 7n, 7n],
      [7n, 0n, 7n],
      [0n, 0n, 0n],
      [-12n, 8n, 4n],
      [12n, -8n, 4n],
      [-15n, -25n, 5n],
    ];
    for (const [a, b, expectedGcd] of cases) {
      const res = extGcdBigInt(a, b);
      expect(Object.isFrozen(res)).toBe(true);
      expect(res.gcd).toBe(expectedGcd);
      expect(a * res.x + b * res.y).toBe(expectedGcd);
    }
  });
});

describe('solveCongruences', () => {
  it('returns the frozen identity congruence for an empty system', () => {
    const res = solveCongruences([]);
    expect(Object.isFrozen(res)).toBe(true);
    expect(res).toEqual({ remainder: 0n, modulus: 1n });
  });

  it('canonicalizes a single congruence with negative or oversized remainders', () => {
    const neg = solveCongruences([{ remainder: -2n, modulus: 5n }]);
    expect(Object.isFrozen(neg)).toBe(true);
    expect(neg).toEqual({ remainder: 3n, modulus: 5n });

    const over = solveCongruences([{ remainder: 14n, modulus: 6n }]);
    expect(over).toEqual({ remainder: 2n, modulus: 6n });
  });

  it('solves classic coprime systems and large BigInt moduli', () => {
    const classic = solveCongruences([
      { remainder: 2n, modulus: 3n },
      { remainder: 3n, modulus: 5n },
      { remainder: 2n, modulus: 7n },
    ]);
    expect(classic).toEqual({ remainder: 23n, modulus: 105n });

    const largeInput: readonly Congruence[] = [
      { remainder: 0n, modulus: 17n },
      { remainder: -2n, modulus: 13n },
      { remainder: -3n, modulus: 19n },
      { remainder: -7n, modulus: 1_000_000_007n },
    ];
    const large = solveCongruences(largeInput);
    expect(large.modulus).toBe(17n * 13n * 19n * 1_000_000_007n);
    for (const c of largeInput) {
      const expected = ((c.remainder % c.modulus) + c.modulus) % c.modulus;
      expect(large.remainder % c.modulus).toBe(expected);
    }
  });

  it('solves compatible non-coprime systems with lcm modulus', () => {
    const res = solveCongruences([
      { remainder: 2n, modulus: 4n },
      { remainder: 4n, modulus: 6n },
      { remainder: 10n, modulus: 15n },
    ]);
    expect(res).toEqual({ remainder: 10n, modulus: 60n });
  });

  it('throws RangeError for non-positive moduli or incompatible congruences', () => {
    expect(() => solveCongruences([{ remainder: 1n, modulus: 0n }])).toThrow(RangeError);
    expect(() => solveCongruences([{ remainder: 1n, modulus: -5n }])).toThrow(RangeError);
    expect(() =>
      solveCongruences([
        { remainder: 1n, modulus: 4n },
        { remainder: 2n, modulus: 6n },
      ]),
    ).toThrow(RangeError);
  });
});
