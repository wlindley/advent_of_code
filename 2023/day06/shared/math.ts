/** Exact floor integer square root `floor(sqrt(value))` for non-negative `bigint`s. */
export function bigintIsqrt(value: bigint): bigint {
  if (value < 0n) {
    throw new RangeError(`Cannot compute integer square root of negative bigint: ${value}`);
  }
  if (value < 2n) return value;

  // Seed strictly above sqrt(value) so Newton iteration decreases monotonically to floor(sqrt(value)).
  let x = 1n << BigInt(Math.ceil(value.toString(2).length / 2));
  let next = (x + value / x) >> 1n;
  while (next < x) {
    x = next;
    next = (x + value / x) >> 1n;
  }
  return x;
}
