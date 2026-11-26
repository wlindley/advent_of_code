import { describe, expect, it } from 'vitest';
import { Congruence, extGcdBigInt, mergeCongruenceSets } from './crt';

describe('extGcdBigInt', () => {
  it('computes Bezout coefficients for coprime and non-coprime inputs', () => {
    const coprime = extGcdBigInt(17n, 13n);
    expect(Object.isFrozen(coprime)).toBe(true);
    expect(coprime.gcd).toBe(1n);
    expect(17n * coprime.x + 13n * coprime.y).toBe(1n);

    const shared = extGcdBigInt(12n, 8n);
    expect(shared.gcd).toBe(4n);
    expect(12n * shared.x + 8n * shared.y).toBe(4n);

    const withZero = extGcdBigInt(0n, 7n);
    expect(withZero).toEqual({ gcd: 7n, x: 0n, y: 1n });
  });

  it('rejects negative inputs with RangeError', () => {
    expect(() => extGcdBigInt(-1n, 5n)).toThrow(RangeError);
    expect(() => extGcdBigInt(5n, -1n)).toThrow(RangeError);
  });
});

describe('Congruence', () => {
  it('canonicalizes negative and oversized remainders and exposes frozen metadata', () => {
    const c1 = new Congruence(-2n, 5n);
    expect(Object.isFrozen(c1)).toBe(true);
    expect(c1.remainder).toBe(3n);
    expect(c1.modulus).toBe(5n);
    expect(c1.isAlignedZero).toBe(false);
    expect(c1.key).toBe('3:5');
    expect(c1.toString()).toBe('t ≡ 3 (mod 5)');

    const c2 = new Congruence(12n, 6n);
    expect(c2.remainder).toBe(0n);
    expect(c2.isAlignedZero).toBe(true);
    expect(Congruence.IDENTITY.remainder).toBe(0n);
    expect(Congruence.IDENTITY.modulus).toBe(1n);
  });

  it('rejects non-positive moduli', () => {
    expect(() => new Congruence(0n, 0n)).toThrow(RangeError);
    expect(() => new Congruence(1n, -3n)).toThrow(RangeError);
  });

  it('lifts to the smallest congruent step at or above minStep', () => {
    const c = new Congruence(3n, 5n);
    expect(c.liftAtLeast(0n)).toBe(3n);
    expect(c.liftAtLeast(3n)).toBe(3n);
    expect(c.liftAtLeast(4n)).toBe(8n);
    expect(c.liftAtLeast(13n)).toBe(13n);
    expect(c.liftAtLeast(-4n)).toBe(-2n);
  });

  it('merges compatible congruences and returns undefined when incompatible', () => {
    const a = new Congruence(2n, 4n);
    const b = new Congruence(4n, 6n);
    const merged = a.merge(b);
    expect(merged).toBeDefined();
    expect(merged!.remainder).toBe(10n);
    expect(merged!.modulus).toBe(12n);

    const conflict = new Congruence(1n, 4n).merge(new Congruence(2n, 6n));
    expect(conflict).toBeUndefined();
  });
});

describe('mergeCongruenceSets', () => {
  it('merges frontiers, deduplicates by key, and counts pruned incompatible pairs', () => {
    const current = [new Congruence(1n, 2n), new Congruence(0n, 2n)];
    const options = [new Congruence(2n, 3n), new Congruence(0n, 4n)];
    const outcome = mergeCongruenceSets(current, options);

    expect(Object.isFrozen(outcome)).toBe(true);
    expect(Object.isFrozen(outcome.congruences)).toBe(true);
    expect(outcome.prunedCount).toBe(1);
    expect(outcome.congruences.map((c) => c.key)).toEqual(['5:6', '2:6', '0:4']);

    const dedup = mergeCongruenceSets(
      [new Congruence(0n, 2n), new Congruence(0n, 4n)],
      [new Congruence(0n, 4n)],
    );
    expect(dedup.prunedCount).toBe(0);
    expect(dedup.congruences.map((c) => c.key)).toEqual(['0:4']);
  });
});
