/** Computes the non-negative greatest common divisor of two BigInts (`gcd(0n, 0n) === 0n`). */
export function gcdBigInt(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y !== 0n) {
    [x, y] = [y, x % y];
  }
  return x;
}

/** Computes the non-negative least common multiple of two BigInts (`0n` if either is zero). */
export function lcmBigInt(a: bigint, b: bigint): bigint {
  if (a === 0n || b === 0n) return 0n;
  const absA = a < 0n ? -a : a;
  const absB = b < 0n ? -b : b;
  return (absA / gcdBigInt(absA, absB)) * absB;
}

/** Computes exact `floor(n / d)` for positive divisor `d > 0n`. */
export function floorDiv(n: bigint, d: bigint): bigint {
  if (d <= 0n) throw new RangeError(`floorDiv requires positive divisor, got ${d}`);
  const q = n / d;
  return n < 0n && n % d !== 0n ? q - 1n : q;
}

/** Computes exact `ceil(n / d)` for positive divisor `d > 0n`. */
export function ceilDiv(n: bigint, d: bigint): bigint {
  if (d <= 0n) throw new RangeError(`ceilDiv requires positive divisor, got ${d}`);
  const q = n / d;
  return n > 0n && n % d !== 0n ? q + 1n : q;
}

/**
 * Immutable arbitrary-precision rational number in canonical lowest terms (`den > 0n`).
 */
export class Rational {
  static readonly ZERO = new Rational(0n, 1n);
  static readonly ONE = new Rational(1n, 1n);

  readonly num: bigint;
  readonly den: bigint;

  constructor(num: bigint, den = 1n) {
    if (den === 0n) throw new RangeError('Rational denominator cannot be zero');
    // Normalize sign onto numerator; gcd(0n, d) === d automatically normalizes zero to 0n/1n.
    const sign = den < 0n ? -1n : 1n;
    const n = num * sign;
    const d = den * sign;
    const g = gcdBigInt(n, d);
    this.num = n / g;
    this.den = d / g;
    Object.freeze(this);
  }

  get isZero(): boolean {
    return this.num === 0n;
  }

  add(other: Rational): Rational {
    return new Rational(this.num * other.den + other.num * this.den, this.den * other.den);
  }

  sub(other: Rational): Rational {
    return new Rational(this.num * other.den - other.num * this.den, this.den * other.den);
  }

  mul(other: Rational): Rational {
    return new Rational(this.num * other.num, this.den * other.den);
  }

  div(other: Rational): Rational {
    if (other.isZero) throw new RangeError('Division by zero Rational');
    return new Rational(this.num * other.den, this.den * other.num);
  }

  equals(other: Rational): boolean {
    return this.num === other.num && this.den === other.den;
  }

  toString(): string {
    return this.den === 1n ? String(this.num) : `${this.num}/${this.den}`;
  }
}
