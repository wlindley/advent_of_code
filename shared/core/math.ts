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
