/** Validates an optional `maxSteps` trace cap against a default positive integer. */
export function validateMaxSteps(maxSteps: number | undefined, defaultMax: number): number {
  const limit = maxSteps ?? defaultMax;
  if (!Number.isInteger(limit) || limit < 1) {
    throw new RangeError(`maxSteps must be a positive integer, got ${limit}`);
  }
  return limit;
}

/**
 * Uniformly samples up to `maxSteps` indices in `[0, total - 1]`.
 * Guarantees endpoint preservation: returns `[]` for `total === 0`, `[total - 1]` for `maxSteps === 1`,
 * and strictly increasing indices starting at `0` and ending at `total - 1` otherwise.
 */
export function sampleTraceIndices(total: number, maxSteps: number): readonly number[] {
  if (!Number.isInteger(total) || total < 0) {
    throw new RangeError(`total must be a non-negative integer, got ${total}`);
  }
  const limit = validateMaxSteps(maxSteps, maxSteps);
  if (total === 0) return Object.freeze([]);
  if (total <= limit) {
    return Object.freeze(Array.from({ length: total }, (_, i) => i));
  }
  if (limit === 1) return Object.freeze([total - 1]);
  const indices: number[] = [];
  for (let k = 0; k < limit; k += 1) {
    indices.push(Math.round((k * (total - 1)) / (limit - 1)));
  }
  return Object.freeze(indices);
}
