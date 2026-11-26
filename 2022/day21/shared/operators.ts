import { Rational } from '../../../shared/core';

export type BinaryOp = '+' | '-' | '*' | '/';

export function isBinaryOp(value: string): value is BinaryOp {
  return value === '+' || value === '-' || value === '*' || value === '/';
}

function formatSlopeTerm(slope: Rational, varName: string): string {
  if (slope.equals(Rational.ONE)) return varName;
  if (slope.equals(new Rational(-1n))) return `-${varName}`;
  return `${slope.toString()}*${varName}`;
}

/** Exact rational affine expression `slope * x + intercept`. */
export class AffineExpr {
  static readonly VARIABLE = new AffineExpr(Rational.ONE, Rational.ZERO);

  static constant(value: Rational): AffineExpr {
    return new AffineExpr(Rational.ZERO, value);
  }

  readonly slope: Rational;
  readonly intercept: Rational;

  constructor(slope: Rational, intercept: Rational) {
    this.slope = slope;
    this.intercept = intercept;
    Object.freeze(this);
  }

  get isConstant(): boolean {
    return this.slope.isZero;
  }

  evaluateAt(x: Rational): Rational {
    return this.slope.mul(x).add(this.intercept);
  }

  equals(other: AffineExpr): boolean {
    return this.slope.equals(other.slope) && this.intercept.equals(other.intercept);
  }

  toString(varName: string): string {
    if (this.slope.isZero) return this.intercept.toString();
    const slopeTerm = formatSlopeTerm(this.slope, varName);
    if (this.intercept.isZero) return slopeTerm;
    if (this.intercept.num < 0n) {
      const absIntercept = new Rational(-this.intercept.num, this.intercept.den);
      return `${slopeTerm} - ${absIntercept.toString()}`;
    }
    return `${slopeTerm} + ${this.intercept.toString()}`;
  }
}

export interface BinaryOperatorSpec {
  readonly symbol: BinaryOp;
  apply(left: Rational, right: Rational): Rational;
  applyAffine(left: AffineExpr, right: AffineExpr): AffineExpr;
  invertLeft(target: Rational, right: Rational): Rational;
  invertRight(target: Rational, left: Rational): Rational;
}

const ADD_SPEC: BinaryOperatorSpec = Object.freeze<BinaryOperatorSpec>({
  symbol: '+',
  apply: (l, r) => l.add(r),
  applyAffine: (l, r) => new AffineExpr(l.slope.add(r.slope), l.intercept.add(r.intercept)),
  invertLeft: (target, right) => target.sub(right),
  invertRight: (target, left) => target.sub(left),
});

const SUB_SPEC: BinaryOperatorSpec = Object.freeze<BinaryOperatorSpec>({
  symbol: '-',
  apply: (l, r) => l.sub(r),
  applyAffine: (l, r) => new AffineExpr(l.slope.sub(r.slope), l.intercept.sub(r.intercept)),
  invertLeft: (target, right) => target.add(right),
  invertRight: (target, left) => left.sub(target),
});

const MUL_SPEC: BinaryOperatorSpec = Object.freeze<BinaryOperatorSpec>({
  symbol: '*',
  apply: (l, r) => l.mul(r),
  applyAffine: (l, r) => {
    if (!l.isConstant && !r.isConstant) {
      throw new Error('Cannot multiply two non-constant affine expressions');
    }
    return new AffineExpr(
      l.slope.mul(r.intercept).add(r.slope.mul(l.intercept)),
      l.intercept.mul(r.intercept),
    );
  },
  invertLeft: (target, right) => target.div(right),
  invertRight: (target, left) => target.div(left),
});

const DIV_SPEC: BinaryOperatorSpec = Object.freeze<BinaryOperatorSpec>({
  symbol: '/',
  apply: (l, r) => l.div(r),
  applyAffine: (l, r) => {
    if (!r.isConstant) {
      throw new Error('Cannot divide by a non-constant affine expression');
    }
    return new AffineExpr(l.slope.div(r.intercept), l.intercept.div(r.intercept));
  },
  invertLeft: (target, right) => {
    if (right.isZero) throw new RangeError('Cannot invert division with zero right operand');
    return target.mul(right);
  },
  invertRight: (target, left) => {
    if (left.isZero) throw new RangeError('Cannot invert division with zero left operand');
    return left.div(target);
  },
});

/** Registry of exact Rational and AffineExpr semantics and algebraic inverses for monkey operators. */
export const BINARY_OPERATORS: Readonly<Record<BinaryOp, BinaryOperatorSpec>> = Object.freeze({
  '+': ADD_SPEC,
  '-': SUB_SPEC,
  '*': MUL_SPEC,
  '/': DIV_SPEC,
});
