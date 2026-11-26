import { describe, expect, it } from 'vitest';
import { bitCount, DEFAULT_MAX_NULLITY, Gf2LinearSystem } from './gf2';

describe('bitCount', () => {
  it('counts bits for zero, small, and >64-bit masks', () => {
    expect(bitCount(0n)).toBe(0);
    expect(bitCount(0b101101n)).toBe(4);
    expect(bitCount((1n << 75n) | (1n << 64n) | 7n)).toBe(5);
  });

  it('rejects negative masks with RangeError', () => {
    expect(() => bitCount(-1n)).toThrow(RangeError);
  });
});

describe('Gf2LinearSystem', () => {
  it('solves via full RREF (row swap, no-swap, above+below elimination, redundant 0=0)', () => {
    const sys = new Gf2LinearSystem(3, [
      { coeffMask: 0b010n, rhs: true },
      { coeffMask: 0b111n, rhs: false },
      { coeffMask: 0b101n, rhs: true },
      { coeffMask: 0b001n, rhs: true },
    ]);
    expect([sys.variableCount, sys.equationCount, sys.rank, sys.nullity, sys.consistent]).toEqual([3, 4, 3, 0, true]);
    expect(sys.pivotColumns).toEqual([0, 1, 2]);
    expect(sys.rrefRows).toEqual([0b1001n, 0b1010n, 0b0100n, 0n]);
    expect(sys.particular).toBe(0b011n);
    expect(sys.nullspaceBasis).toEqual([]);
    expect(sys.minWeightSolution()).toBe(0b011n);
    expect([sys, sys.rrefRows, sys.pivotColumns, sys.nullspaceBasis].every(Object.isFrozen)).toBe(true);
  });

  it('keeps nullspace intact and returns null when inconsistent (0 = 1)', () => {
    const sys = new Gf2LinearSystem(2, [{ coeffMask: 0b11n, rhs: false }, { coeffMask: 0b11n, rhs: true }]);
    expect([sys.consistent, sys.rank, sys.nullity, sys.particular]).toEqual([false, 1, 1, null]);
    expect(sys.nullspaceBasis).toEqual([0b11n]);
    expect(sys.minWeightSolution()).toBeNull();
  });

  it('minimizes Hamming weight across nullspace and tie-breaks smaller mask', () => {
    const tieSmall = new Gf2LinearSystem(3, [{ coeffMask: 0b111n, rhs: true }]);
    expect([tieSmall.nullity, tieSmall.minWeightSolution()]).toEqual([2, 0b001n]);
    const dropsWeight = new Gf2LinearSystem(3, [{ coeffMask: 0b101n, rhs: true }, { coeffMask: 0b110n, rhs: true }]);
    expect(dropsWeight.minWeightSolution()).toBe(0b100n);
    const equalSmaller = new Gf2LinearSystem(4, [
      { coeffMask: 0b0011n, rhs: true }, { coeffMask: 0b0101n, rhs: false }, { coeffMask: 0b1001n, rhs: true },
    ]);
    expect(equalSmaller.minWeightSolution()).toBe(0b0101n);
  });

  it('handles 0 variables, empty equations, and 70-bit wide systems', () => {
    expect(new Gf2LinearSystem(0, []).minWeightSolution()).toBe(0n);
    const bad0 = new Gf2LinearSystem(0, [{ coeffMask: 0n, rhs: true }]);
    expect(bad0.consistent).toBe(false);
    expect(bad0.minWeightSolution()).toBeNull();
    const noEqs = new Gf2LinearSystem(2, []);
    expect(noEqs.nullspaceBasis).toEqual([0b01n, 0b10n]);
    expect(noEqs.minWeightSolution()).toBe(0n);
    const eqs = Array.from({ length: 69 }, (_, i) => ({ coeffMask: 1n << BigInt(i + 1), rhs: i === 68 }));
    expect(new Gf2LinearSystem(70, eqs).minWeightSolution()).toBe(1n << 69n);
  });

  it('validates constructor and minWeightSolution arguments separately', () => {
    expect(() => new Gf2LinearSystem(-1, [])).toThrow(RangeError);
    expect(() => new Gf2LinearSystem(1.5, [])).toThrow(RangeError);
    expect(() => new Gf2LinearSystem(2, [{ coeffMask: -1n, rhs: false }])).toThrow(RangeError);
    expect(() => new Gf2LinearSystem(2, [{ coeffMask: 4n, rhs: false }])).toThrow(RangeError);
    const sys = new Gf2LinearSystem(2, []);
    expect(() => sys.minWeightSolution(-1)).toThrow(RangeError);
    expect(() => sys.minWeightSolution(31)).toThrow(RangeError);
    expect(() => sys.minWeightSolution(1.5)).toThrow(RangeError);
    expect(() => sys.minWeightSolution(1)).toThrow(RangeError);
    expect(DEFAULT_MAX_NULLITY).toBe(24);
  });
});
