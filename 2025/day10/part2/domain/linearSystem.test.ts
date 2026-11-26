import { describe, expect, it } from 'vitest';
import { Rational } from '../../../../shared/core';
import { RationalLinearSystem, type RationalEquation } from './linearSystem';

const eq = (coeffs: number[], rhs: number): RationalEquation => ({
  coeffs: coeffs.map((c) => new Rational(BigInt(c))),
  rhs: new Rational(BigInt(rhs)),
});

describe('RationalLinearSystem', () => {
  it('reduces with row swaps, above/below elimination, and non-TU det=2 fractional pivots', () => {
    const sys = new RationalLinearSystem(2, [eq([0, 2], 4), eq([1, 1], 3)]);
    expect(Object.isFrozen(sys)).toBe(true);
    expect([sys.consistent, sys.equationCount, sys.rank, sys.nullity]).toEqual([true, 2, 2, 0]);
    expect([sys.pivotColumns, sys.freeColumns]).toEqual([[0, 1], []]);
    expect(sys.rrefRows.map((row) => row.map((v) => v.toString()))).toEqual([['1', '0', '1'], ['0', '1', '2']]);

    const nonTu = new RationalLinearSystem(2, [eq([1, 1], 2), eq([1, -1], 1)]);
    expect(nonTu.toIntegerPivotEquations()).toEqual([
      { pivotCol: 0, den: 2n, constant: 3n, freeCoeffs: [] },
      { pivotCol: 1, den: 2n, constant: 1n, freeCoeffs: [] },
    ]);
    expect(nonTu.toIntegerObjectiveForm()).toEqual({ den: 2n, constant: 4n, freeWeights: [] });
  });

  it('handles underdetermined systems (nullity 1 & 2), redundant rows, custom pivotOrder, and empty equations', () => {
    const sys2 = new RationalLinearSystem(3, [eq([1, 1, 1], 5), eq([2, 2, 2], 10)], [2, 0, 1]);
    expect([sys2.consistent, sys2.rank, sys2.nullity]).toEqual([true, 1, 2]);
    expect([sys2.pivotColumns, sys2.freeColumns]).toEqual([[2], [0, 1]]);
    expect(sys2.toIntegerPivotEquations()).toEqual([{ pivotCol: 2, den: 1n, constant: 5n, freeCoeffs: [1n, 1n] }]);
    expect(sys2.toIntegerObjectiveForm()).toEqual({ den: 1n, constant: 5n, freeWeights: [0n, 0n] });

    const sys1 = new RationalLinearSystem(2, [eq([2, 1], 3)]);
    expect(sys1.toIntegerPivotEquations()).toEqual([{ pivotCol: 0, den: 2n, constant: 3n, freeCoeffs: [1n] }]);
    expect(sys1.toIntegerObjectiveForm()).toEqual({ den: 2n, constant: 3n, freeWeights: [1n] });

    const empty = new RationalLinearSystem(2, []);
    expect([empty.consistent, empty.rank, empty.nullity]).toEqual([true, 0, 2]);
    expect(empty.toIntegerObjectiveForm()).toEqual({ den: 1n, constant: 0n, freeWeights: [1n, 1n] });
  });

  it('detects inconsistency and rejects integer conversions on inconsistent systems', () => {
    const inc = new RationalLinearSystem(2, [eq([1, 1], 2), eq([1, 1], 5)]);
    expect(inc.consistent).toBe(false);
    expect(() => inc.toIntegerPivotEquations()).toThrow(Error);
    expect(() => inc.toIntegerObjectiveForm()).toThrow(Error);
  });

  it('validates constructor arguments individually', () => {
    expect(() => new RationalLinearSystem(-1, [])).toThrow(RangeError);
    expect(() => new RationalLinearSystem(1.5, [])).toThrow(RangeError);
    expect(() => new RationalLinearSystem(2, [eq([1], 1)])).toThrow(RangeError);
    expect(() => new RationalLinearSystem(2, [], [0])).toThrow(RangeError);
    expect(() => new RationalLinearSystem(2, [], [0, 2])).toThrow(RangeError);
    expect(() => new RationalLinearSystem(2, [], [-1, 0])).toThrow(RangeError);
    expect(() => new RationalLinearSystem(2, [], [0, 0.5])).toThrow(RangeError);
    expect(() => new RationalLinearSystem(2, [], [1, 1])).toThrow(Error);
  });
});
