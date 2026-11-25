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
