import { describe, expect, it } from 'vitest';
import { RationalLinearSystem } from './linear';
import { Rational } from './rational';

function rat(n: bigint, d: bigint): Rational {
  return new Rational(n, d);
}

function intRat(n: bigint): Rational {
  return new Rational(n, 1n);
}

describe('RationalLinearSystem', () => {
  it('validates variable count and tracks dynamic rank', () => {
    expect(() => new RationalLinearSystem(0)).toThrow(RangeError);
    expect(() => new RationalLinearSystem(-2)).toThrow(RangeError);
    expect(() => new RationalLinearSystem(2.5)).toThrow(RangeError);

    const sys = new RationalLinearSystem(2);
    expect(sys.rank).toBe(0);
    expect(sys.isFullRank).toBe(false);
    expect(() => sys.addEquation([intRat(1n)], intRat(1n))).toThrow(RangeError);
    expect(() => sys.solve()).toThrow(/underdetermined/i);
  });

  it('solves an exact full-rank system with out-of-order pivots and redundant rows', () => {
    const sys = new RationalLinearSystem(3);
    // 0*x + 2*y + 4*z = 14 -> y + 2z = 7
    expect(sys.addEquation([intRat(0n), intRat(2n), intRat(4n)], intRat(14n))).toBe(true);
    expect(sys.rank).toBe(1);
    // Redundant 0 = 0 equation returns false
    expect(sys.addEquation([intRat(0n), intRat(1n), intRat(2n)], intRat(7n))).toBe(false);
    expect(sys.rank).toBe(1);
    // 3*x + 1*y - 1*z = 4
    expect(sys.addEquation([intRat(3n), intRat(1n), intRat(-1n)], intRat(4n))).toBe(true);
    // x - y + 2z = 7
    expect(sys.addEquation([intRat(1n), intRat(-1n), intRat(2n)], intRat(7n))).toBe(true);

    expect(sys.rank).toBe(3);
    expect(sys.isFullRank).toBe(true);

    const sol = sys.solve();
    expect(Object.isFrozen(sol)).toBe(true);
    expect(sol.map((v) => v.toString())).toEqual(['2', '1', '3']);
  });

  it('produces exact non-integer rational solutions and skips zero factors cleanly', () => {
    const sys = new RationalLinearSystem(2);
    expect(sys.addEquation([intRat(0n), intRat(4n)], intRat(3n))).toBe(true);
    expect(sys.addEquation([intRat(2n), intRat(0n)], intRat(1n))).toBe(true);
    const sol = sys.solve();
    expect(sol[0]!.equals(rat(1n, 2n))).toBe(true);
    expect(sol[1]!.equals(rat(3n, 4n))).toBe(true);
  });

  it('throws on inconsistent equations', () => {
    const sys = new RationalLinearSystem(2);
    sys.addEquation([intRat(1n), intRat(2n)], intRat(3n));
    expect(() => sys.addEquation([intRat(2n), intRat(4n)], intRat(7n))).toThrow(/inconsistent/i);
  });
});
