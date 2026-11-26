import { describe, expect, it } from 'vitest';
import { ceilDiv, floorDiv, gcdBigInt, lcmBigInt, Rational } from './rational';

describe('gcdBigInt and lcmBigInt', () => {
  it('computes non-negative gcd across zero and signed inputs', () => {
    expect(gcdBigInt(0n, 0n)).toBe(0n);
    expect(gcdBigInt(0n, -12n)).toBe(12n);
    expect(gcdBigInt(-18n, 0n)).toBe(18n);
    expect(gcdBigInt(-24n, 36n)).toBe(12n);
    expect(gcdBigInt(17n, -13n)).toBe(1n);
  });

  it('computes non-negative lcm and returns 0n when either input is zero', () => {
    expect(lcmBigInt(0n, 5n)).toBe(0n);
    expect(lcmBigInt(5n, 0n)).toBe(0n);
    expect(lcmBigInt(-6n, 8n)).toBe(24n);
    expect(lcmBigInt(12n, -15n)).toBe(60n);
  });
});

describe('floorDiv and ceilDiv', () => {
  it('computes exact floorDiv for positive, zero, and negative numerators', () => {
    expect(floorDiv(7n, 3n)).toBe(2n);
    expect(floorDiv(6n, 3n)).toBe(2n);
    expect(floorDiv(0n, 3n)).toBe(0n);
    expect(floorDiv(-6n, 3n)).toBe(-2n);
    expect(floorDiv(-7n, 3n)).toBe(-3n);
    expect(floorDiv(-1n, 3n)).toBe(-1n);
  });

  it('computes exact ceilDiv for positive, zero, and negative numerators', () => {
    expect(ceilDiv(7n, 3n)).toBe(3n);
    expect(ceilDiv(6n, 3n)).toBe(2n);
    expect(ceilDiv(1n, 3n)).toBe(1n);
    expect(ceilDiv(0n, 3n)).toBe(0n);
    expect(ceilDiv(-6n, 3n)).toBe(-2n);
    expect(ceilDiv(-7n, 3n)).toBe(-2n);
  });

  it('throws RangeError when divisor is non-positive', () => {
    expect(() => floorDiv(5n, 0n)).toThrow(RangeError);
    expect(() => floorDiv(5n, -2n)).toThrow(RangeError);
    expect(() => ceilDiv(5n, 0n)).toThrow(RangeError);
    expect(() => ceilDiv(5n, -2n)).toThrow(RangeError);
  });
});

describe('Rational', () => {
  it('normalizes signs, reduces fractions, and freezes instances', () => {
    const pos = new Rational(6n, 8n);
    expect(pos.num).toBe(3n);
    expect(pos.den).toBe(4n);
    expect(Object.isFrozen(pos)).toBe(true);

    const negDen = new Rational(6n, -8n);
    expect(negDen.num).toBe(-3n);
    expect(negDen.den).toBe(4n);

    const bothNeg = new Rational(-6n, -8n);
    expect(bothNeg.num).toBe(3n);
    expect(bothNeg.den).toBe(4n);

    const zeroNeg = new Rational(0n, -5n);
    expect(zeroNeg.equals(Rational.ZERO)).toBe(true);
    expect(zeroNeg.den).toBe(1n);
    expect(zeroNeg.isZero).toBe(true);
    expect(Rational.ONE.isZero).toBe(false);
    expect(new Rational(5n).toString()).toBe('5');
    expect(negDen.toString()).toBe('-3/4');
  });

  it('performs exact arithmetic, equality, and rejects zero denominators', () => {
    const a = new Rational(1n, 3n);
    const b = new Rational(-1n, 6n);
    expect(a.add(b).equals(new Rational(1n, 6n))).toBe(true);
    expect(a.sub(b).equals(new Rational(1n, 2n))).toBe(true);
    expect(a.mul(b).equals(new Rational(-1n, 18n))).toBe(true);
    expect(a.div(b).equals(new Rational(-2n, 1n))).toBe(true);
    expect(a.equals(new Rational(1n, 4n))).toBe(false);
    expect(a.equals(new Rational(2n, 3n))).toBe(false);

    expect(() => new Rational(1n, 0n)).toThrow(RangeError);
    expect(() => a.div(Rational.ZERO)).toThrow(RangeError);
  });
});
