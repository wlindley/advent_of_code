export interface ExtGcdResult {
  readonly gcd: bigint;
  readonly x: bigint;
  readonly y: bigint;
}

export interface Congruence {
  readonly remainder: bigint;
  readonly modulus: bigint;
}

function modPositive(value: bigint, modulus: bigint): bigint {
  const r = value % modulus;
  return r < 0n ? r + modulus : r;
}

function normalizeCongruence(c: Congruence): Congruence {
  if (c.modulus <= 0n) {
    throw new RangeError(`Congruence modulus must be positive, got ${c.modulus}`);
  }
  return Object.freeze({ remainder: modPositive(c.remainder, c.modulus), modulus: c.modulus });
}

/** Computes Bezout coefficients `(gcd, x, y)` with `gcd >= 0n` satisfying `a * x + b * y === gcd`. */
export function extGcdBigInt(a: bigint, b: bigint): ExtGcdResult {
  const signA = a < 0n ? -1n : 1n;
  const signB = b < 0n ? -1n : 1n;
  let oldR = a * signA;
  let r = b * signB;
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
  return Object.freeze({ gcd: oldR, x: oldS * signA, y: oldT * signB });
}

function mergePair(a: Congruence, b: Congruence): Congruence {
  const { gcd, x } = extGcdBigInt(a.modulus, b.modulus);
  const diff = b.remainder - a.remainder;
  if (diff % gcd !== 0n) {
    throw new RangeError(
      `Incompatible congruences: x ≡ ${a.remainder} (mod ${a.modulus}) and x ≡ ${b.remainder} (mod ${b.modulus})`,
    );
  }
  const step = b.modulus / gcd;
  const k = ((diff / gcd) * x) % step;
  const lcm = (a.modulus / gcd) * b.modulus;
  return Object.freeze({ remainder: modPositive(a.remainder + k * a.modulus, lcm), modulus: lcm });
}

/**
 * Solves a system of linear congruences `x ≡ remainder (mod modulus)` via generalized CRT.
 * Handles both coprime and non-coprime moduli; returns `{ remainder: 0n, modulus: 1n }` when empty.
 * Throws `RangeError` if any modulus is `<= 0n` or if the system has no solution.
 */
export function solveCongruences(congruences: readonly Congruence[]): Congruence {
  let acc: Congruence = Object.freeze({ remainder: 0n, modulus: 1n });
  for (const raw of congruences) {
    acc = mergePair(acc, normalizeCongruence(raw));
  }
  return acc;
}
