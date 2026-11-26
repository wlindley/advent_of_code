import { ceilDiv } from '../../../../shared/core';

export interface ExtGcdResult {
  readonly gcd: bigint;
  readonly x: bigint;
  readonly y: bigint;
}

export interface CongruenceMergeOutcome {
  readonly congruences: readonly Congruence[];
  readonly prunedCount: number;
}

/** Computes Bezout coefficients `(gcd, x, y)` satisfying `a*x + b*y = gcd` for non-negative integers. */
export function extGcdBigInt(a: bigint, b: bigint): ExtGcdResult {
  if (a < 0n || b < 0n) {
    throw new RangeError(`extGcdBigInt requires non-negative inputs, got (${a}, ${b})`);
  }
  let oldR = a;
  let r = b;
  let oldS = 1n;
  let s = 0n;
  let oldT = 0n;
  let t = 1n;
  while (r !== 0n) {
    const q = oldR / r;
    [oldR, r] = [r, oldR - q * r];
    [oldS, s] = [s, oldS - q * s];
    [oldT, t] = [t, oldT - q * t];
  }
  return Object.freeze({ gcd: oldR, x: oldS, y: oldT });
}

/** Immutable canonical linear congruence `t ≡ remainder (mod modulus)` with `modulus > 0`. */
export class Congruence {
  static readonly IDENTITY = new Congruence(0n, 1n);

  readonly remainder: bigint;
  readonly modulus: bigint;

  constructor(remainder: bigint, modulus: bigint) {
    if (modulus <= 0n) {
      throw new RangeError(`Congruence modulus must be positive, got ${modulus}`);
    }
    const mod = remainder % modulus;
    this.remainder = mod < 0n ? mod + modulus : mod;
    this.modulus = modulus;
    Object.freeze(this);
  }

  get isAlignedZero(): boolean {
    return this.remainder === 0n;
  }

  get key(): string {
    return `${this.remainder}:${this.modulus}`;
  }

  liftAtLeast(minStep: bigint): bigint {
    return this.remainder + ceilDiv(minStep - this.remainder, this.modulus) * this.modulus;
  }

  merge(other: Congruence): Congruence | undefined {
    const { gcd, x } = extGcdBigInt(this.modulus, other.modulus);
    const diff = other.remainder - this.remainder;
    if (diff % gcd !== 0n) return undefined;
    const step = other.modulus / gcd;
    const k = ((diff / gcd) * x) % step;
    return new Congruence(this.remainder + k * this.modulus, (this.modulus / gcd) * other.modulus);
  }

  toString(): string {
    return `t ≡ ${this.remainder} (mod ${this.modulus})`;
  }
}

/** Merges every `(a, b)` pair in `current × options`, deduplicating by key and counting conflicts. */
export function mergeCongruenceSets(
  current: readonly Congruence[],
  options: readonly Congruence[],
): CongruenceMergeOutcome {
  const seen = new Set<string>();
  const congruences: Congruence[] = [];
  let prunedCount = 0;

  for (const a of current) {
    for (const b of options) {
      const merged = a.merge(b);
      if (merged === undefined) {
        prunedCount += 1;
        continue;
      }
      if (!seen.has(merged.key)) {
        seen.add(merged.key);
        congruences.push(merged);
      }
    }
  }

  return Object.freeze({ congruences: Object.freeze(congruences), prunedCount });
}
