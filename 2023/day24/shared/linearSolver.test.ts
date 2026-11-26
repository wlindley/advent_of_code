import { describe, expect, it } from 'vitest';
import { Rational } from '../../../shared/core';
import { RationalLinearSystem } from './linearSolver';

function r(n: bigint, d = 1n): Rational {
  return new Rational(n, d);
}

describe('RationalLinearSystem', () => {
  it('validates variable count and tracks dynamic rank', () => {
    expect(() => new RationalLinearSystem(0)).toThrow(RangeError);
    expect(() => new RationalLinearSystem(-2)).toThrow(RangeError);
    expect(() => new RationalLinearSystem(2.5)).toThrow(RangeError);

    const sys = new RationalLinearSystem(2);
    expect(sys.rank).toBe(0);
    expect(sys.isFullRank).toBe(false);
    expect(() => sys.addEquation([r(1n)], r(1n))).toThrow(RangeError);
    expect(() => sys.solve()).toThrow(/underdetermined/i);
  });

  it('solves an exact full-rank system with out-of-order pivots and fractions', () => {
    const sys = new RationalLinearSystem(3);
    // 0*x + 2*y + 4*z = 14  -> y + 2z = 7
    expect(sys.addEquation([r(0n), r(2n), r(4n)], r(14n))).toBe(true);
    expect(sys.rank).toBe(1);
    // Redundant 0 = 0 equation returns false
    expect(sys.addEquation([r(0n), r(1n), r(2n)], r(7n))).toBe(false);
    expect(sys.rank).toBe(1);
    // 3*x + 1*y - 1*z = 4
    expect(sys.addEquation([r(3n), r(1n), r(-1n)], r(4n))).toBe(true);
    // x - y + 2z = 7
    expect(sys.addEquation([r(1n), r(-1n), r(2n)], r(7n))).toBe(true);

    expect(sys.rank).toBe(3);
    expect(sys.isFullRank).toBe(true);

    const sol = sys.solve();
    expect(Object.isFrozen(sol)).toBe(true);
    expect(sol.map((v) => v.toString())).toEqual(['2', '1', '3']);
  });

  it('produces exact rational non-integer solutions and skips zero factors cleanly', () => {
    const sys = new RationalLinearSystem(2);
    // x = 1/2, y = 3/4 via decoupled equations (covers zero-factor skip in back-elimination)
    expect(sys.addEquation([r(0n), r(4n)], r(3n))).toBe(true);
    expect(sys.addEquation([r(2n), r(0n)], r(1n))).toBe(true);
    const sol = sys.solve();
    expect(sol[0]!.equals(r(1n, 2n))).toBe(true);
    expect(sol[1]!.equals(r(3n, 4n))).toBe(true);
  });

  it('throws on inconsistent equations', () => {
    const sys = new RationalLinearSystem(2);
    sys.addEquation([r(1n), r(2n)], r(3n));
    expect(() => sys.addEquation([r(2n), r(4n)], r(7n))).toThrow(/inconsistent/i);
  });
});
