export const PRUNE_MODULUS = 16_777_216;
export const PRUNE_MASK = 0xffffff;
export const DEFAULT_SECRET_STEPS = 2_000;

/** Validates that `value` is a non-negative safe integer (`>= 0`). */
export function assertNonNegativeSafeInt(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative safe integer, got ${value}`);
  }
}

/** Validates that `value` is a positive safe integer (`>= 1`). */
export function assertPositiveSafeInt(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new RangeError(`${label} must be a positive safe integer, got ${value}`);
  }
}

/** Mixes `value` into `secret` via 53-bit-safe integer XOR. */
export function mix(secret: number, value: number): number {
  assertNonNegativeSafeInt(secret, 'secret');
  assertNonNegativeSafeInt(value, 'value');
  return Number(BigInt(secret) ^ BigInt(value));
}

/** Prunes `secret` modulo 2^24 (`16_777_216`). */
export function prune(secret: number): number {
  assertNonNegativeSafeInt(secret, 'secret');
  return secret & PRUNE_MASK;
}

/** Extracts the ones-digit banana price (`0..9`) from `secret`. */
export function secretPrice(secret: number): number {
  assertNonNegativeSafeInt(secret, 'secret');
  return secret % 10;
}

function stepSecret24(x: number): number {
  x = (x ^ (x << 6)) & PRUNE_MASK;
  x = x ^ (x >>> 5); // Why: 0 <= x < 2^24 => x >>> 5 < 2^19, stays in 24 bits
  return (x ^ (x << 11)) & PRUNE_MASK;
}

/** Advances `secret` by one Monkey Market PRNG step. */
export function advanceSecret(secret: number): number {
  assertNonNegativeSafeInt(secret, 'secret');
  return stepSecret24(secret & PRUNE_MASK);
}

/** Advances `secret` by `steps` PRNG transitions (returns `secret` unchanged if `steps === 0`). */
export function advanceSecretN(secret: number, steps: number): number {
  assertNonNegativeSafeInt(secret, 'secret');
  assertNonNegativeSafeInt(steps, 'steps');
  if (steps === 0) return secret;
  let cur = secret & PRUNE_MASK;
  for (let i = 0; i < steps; i += 1) {
    cur = stepSecret24(cur);
  }
  return cur;
}
