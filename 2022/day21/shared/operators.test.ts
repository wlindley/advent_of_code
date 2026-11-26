import { describe, expect, it } from 'vitest';
import { Rational } from '../../../shared/core';
import { AffineExpr, BINARY_OPERATORS, isBinaryOp } from './operators';

const r = (n: bigint, d = 1n): Rational => new Rational(n, d);

describe('operators', () => {
  it('validates binary operator symbols', () => {
    expect(isBinaryOp('+')).toBe(true);
    expect(isBinaryOp('-')).toBe(true);
    expect(isBinaryOp('*')).toBe(true);
    expect(isBinaryOp('/')).toBe(true);
    expect(isBinaryOp('%')).toBe(false);
    expect(isBinaryOp('')).toBe(false);
  });

  it('constructs, evaluates, compares, and formats AffineExpr', () => {
    const x = AffineExpr.VARIABLE;
    const c = AffineExpr.constant(r(5n));
    const line = new AffineExpr(r(2n), r(-3n));
    const negOne = new AffineExpr(r(-1n), r(4n));
    const frac = new AffineExpr(r(3n, 2n), r(0n));

    expect(x.isConstant).toBe(false);
    expect(c.isConstant).toBe(true);
    expect(line.evaluateAt(r(4n)).equals(r(5n))).toBe(true);
    expect(line.equals(new AffineExpr(r(2n), r(-3n)))).toBe(true);
    expect(line.equals(c)).toBe(false);
    expect(line.equals(new AffineExpr(r(2n), r(1n)))).toBe(false);
    expect(c.toString('humn')).toBe('5');
    expect(x.toString('humn')).toBe('humn');
    expect(negOne.toString('humn')).toBe('-humn + 4');
    expect(line.toString('humn')).toBe('2*humn - 3');
    expect(frac.toString('humn')).toBe('3/2*humn');
  });

  it('evaluates and inverts +, -, *, / over Rationals', () => {
    expect(BINARY_OPERATORS['+'].apply(r(6n), r(2n)).equals(r(8n))).toBe(true);
    expect(BINARY_OPERATORS['+'].invertLeft(r(8n), r(2n)).equals(r(6n))).toBe(true);
    expect(BINARY_OPERATORS['+'].invertRight(r(8n), r(6n)).equals(r(2n))).toBe(true);

    expect(BINARY_OPERATORS['-'].apply(r(6n), r(2n)).equals(r(4n))).toBe(true);
    expect(BINARY_OPERATORS['-'].invertLeft(r(4n), r(2n)).equals(r(6n))).toBe(true);
    expect(BINARY_OPERATORS['-'].invertRight(r(4n), r(6n)).equals(r(2n))).toBe(true);

    expect(BINARY_OPERATORS['*'].apply(r(6n), r(2n)).equals(r(12n))).toBe(true);
    expect(BINARY_OPERATORS['*'].invertLeft(r(12n), r(2n)).equals(r(6n))).toBe(true);
    expect(BINARY_OPERATORS['*'].invertRight(r(12n), r(6n)).equals(r(2n))).toBe(true);

    expect(BINARY_OPERATORS['/'].apply(r(6n), r(2n)).equals(r(3n))).toBe(true);
    expect(BINARY_OPERATORS['/'].invertLeft(r(3n), r(2n)).equals(r(6n))).toBe(true);
    expect(BINARY_OPERATORS['/'].invertRight(r(3n), r(6n)).equals(r(2n))).toBe(true);
  });

  it('guards zero operands during division inversion', () => {
    expect(() => BINARY_OPERATORS['/'].invertLeft(r(3n), r(0n))).toThrow(RangeError);
    expect(() => BINARY_OPERATORS['/'].invertRight(r(3n), r(0n))).toThrow(RangeError);
    expect(() => BINARY_OPERATORS['/'].invertRight(r(0n), r(6n))).toThrow(RangeError);
    expect(() => BINARY_OPERATORS['*'].invertLeft(r(0n), r(0n))).toThrow(RangeError);
  });

  it('applies operators to AffineExpr and rejects non-affine multiplication or division', () => {
    const x = AffineExpr.VARIABLE;
    const c2 = AffineExpr.constant(r(2n));
    const c4 = AffineExpr.constant(r(4n));

    expect(BINARY_OPERATORS['+'].applyAffine(x, c2).equals(new AffineExpr(r(1n), r(2n)))).toBe(true);
    expect(BINARY_OPERATORS['-'].applyAffine(x, c2).equals(new AffineExpr(r(1n), r(-2n)))).toBe(true);
    expect(BINARY_OPERATORS['*'].applyAffine(x, c2).equals(new AffineExpr(r(2n), r(0n)))).toBe(true);
    expect(BINARY_OPERATORS['*'].applyAffine(c2, x).equals(new AffineExpr(r(2n), r(0n)))).toBe(true);
    expect(BINARY_OPERATORS['/'].applyAffine(new AffineExpr(r(2n), r(4n)), c2).equals(new AffineExpr(r(1n), r(2n)))).toBe(true);
    expect(BINARY_OPERATORS['/'].applyAffine(c4, c2).equals(c2)).toBe(true);

    expect(() => BINARY_OPERATORS['*'].applyAffine(x, x)).toThrow(Error);
    expect(() => BINARY_OPERATORS['/'].applyAffine(c2, x)).toThrow(Error);
  });
});
