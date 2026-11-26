import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SECRET_STEPS,
  PRUNE_MASK,
  PRUNE_MODULUS,
  advanceSecret,
  advanceSecretN,
  assertNonNegativeSafeInt,
  assertPositiveSafeInt,
  mix,
  prune,
  secretPrice,
} from './prng';

describe('prng constants and validators', () => {
  it('exposes canonical 24-bit pruning constants', () => {
    expect(PRUNE_MODULUS).toBe(16_777_216);
    expect(PRUNE_MASK).toBe(0xffffff);
    expect(DEFAULT_SECRET_STEPS).toBe(2_000);
  });

  it('validates non-negative and positive safe integers', () => {
    expect(() => assertNonNegativeSafeInt(0, 'x')).not.toThrow();
    expect(() => assertNonNegativeSafeInt(Number.MAX_SAFE_INTEGER, 'x')).not.toThrow();
    expect(() => assertNonNegativeSafeInt(-1, 'x')).toThrow(RangeError);
    expect(() => assertNonNegativeSafeInt(1.5, 'x')).toThrow(RangeError);
    expect(() => assertNonNegativeSafeInt(Number.MAX_SAFE_INTEGER + 1, 'x')).toThrow(RangeError);

    expect(() => assertPositiveSafeInt(1, 'n')).not.toThrow();
    expect(() => assertPositiveSafeInt(0, 'n')).toThrow(RangeError);
    expect(() => assertPositiveSafeInt(-3, 'n')).toThrow(RangeError);
    expect(() => assertPositiveSafeInt(2.2, 'n')).toThrow(RangeError);
  });
});

describe('mix, prune, and secretPrice', () => {
  it('mixes via 53-bit-safe XOR and rejects invalid operands', () => {
    expect(mix(42, 15)).toBe(37);
    expect(mix(Number.MAX_SAFE_INTEGER, 1)).toBe(Number.MAX_SAFE_INTEGER - 1);
    expect(() => mix(-1, 5)).toThrow(RangeError);
    expect(() => mix(5, -1)).toThrow(RangeError);
  });

  it('prunes modulo 2^24 across large safe integers and reads ones-digit price', () => {
    expect(prune(100_000_000)).toBe(16_113_920);
    expect(prune(Number.MAX_SAFE_INTEGER)).toBe(Number.MAX_SAFE_INTEGER % PRUNE_MODULUS);
    expect(() => prune(-1)).toThrow(RangeError);

    expect(secretPrice(123)).toBe(3);
    expect(secretPrice(15_887_950)).toBe(0);
    expect(() => secretPrice(-2)).toThrow(RangeError);
  });
});

describe('advanceSecret and advanceSecretN', () => {
  it('matches the official first 10 secrets starting from 123', () => {
    const expected = [
      15_887_950, 16_495_136, 527_345, 704_524, 1_553_684,
      12_683_156, 11_100_544, 12_249_484, 7_753_432, 5_908_254,
    ];
    let cur = 123;
    for (const exp of expected) {
      cur = advanceSecret(cur);
      expect(cur).toBe(exp);
    }
    expect(advanceSecretN(123, 10)).toBe(5_908_254);
  });

  it('matches the official 2000th secrets and preserves unpruned seed at 0 steps', () => {
    expect(advanceSecretN(1, 2_000)).toBe(8_685_429);
    expect(advanceSecretN(10, 2_000)).toBe(4_700_978);
    expect(advanceSecretN(100, 2_000)).toBe(15_273_692);
    expect(advanceSecretN(2024, 2_000)).toBe(8_667_524);
    expect(advanceSecretN(100_000_000, 0)).toBe(100_000_000);
    expect(advanceSecret(100_000_000)).toBe(advanceSecret(16_113_920));
    expect(() => advanceSecret(-1)).toThrow(RangeError);
    expect(() => advanceSecretN(1, -1)).toThrow(RangeError);
  });
});
