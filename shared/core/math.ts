/** Euclidean modulo returning a non-negative integer in [0, divisor). */
export function euclideanMod(dividend: number, divisor: number): number {
  if (!Number.isSafeInteger(dividend)) {
    throw new RangeError('dividend must be a safe integer');
  }
  if (!Number.isSafeInteger(divisor) || divisor <= 0) {
    throw new RangeError('divisor must be a positive safe integer');
  }
  const r = dividend % divisor;
  return r < 0 ? r + divisor : r === 0 ? 0 : r;
}

/**
 * Exact top-53-bit base-2 logarithm of a positive `bigint`.
 * Avoids `Number(big)` overflow to `Infinity` for values past `2^1024`.
 */
export function bigintLog2(value: bigint): number {
  if (value <= 0n) {
    throw new RangeError(`bigintLog2 requires a positive BigInt, got ${value}`);
  }
  const shift = Math.max(0, value.toString(2).length - 53);
  return shift + Math.log2(Number(value >> BigInt(shift)));
}

/** Exact floor integer square root `floor(sqrt(n))` for non-negative `bigint`s. */
export function bigintIsqrt(n: bigint): bigint {
  if (n < 0n) {
    throw new RangeError(`bigintIsqrt requires a non-negative BigInt, got ${n}`);
  }
  if (n < 2n) return n;

  // Seed strictly above sqrt(n) so Newton iteration decreases monotonically to floor(sqrt(n)).
  let x = 1n << BigInt(Math.ceil(n.toString(2).length / 2));
  let next = (x + n / x) >> 1n;
  while (next < x) {
    x = next;
    next = (x + n / x) >> 1n;
  }
  return x;
}
