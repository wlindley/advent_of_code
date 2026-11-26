import { ADD_OPERATOR, MUL_OPERATOR, type CalibrationOperator } from '../../shared';

/** Computes the smallest power of 10 strictly greater than `right` (`>= 1n`). */
function decimalScale(right: bigint): bigint {
  if (right < 1n) {
    throw new RangeError(`Concatenation right operand must be >= 1, got ${right}`);
  }
  // Strict `<=` ensures exact powers of 10 (e.g. 10 -> 100, 100 -> 1000) shift cleanly.
  let scale = 10n;
  while (scale <= right) {
    scale *= 10n;
  }
  return scale;
}

export const CONCAT_OPERATOR: CalibrationOperator = Object.freeze({
  id: 'concat',
  symbol: '||',
  label: 'Concat',
  apply(left: bigint, right: bigint): bigint {
    return left * decimalScale(right) + right;
  },
  tryInvert(remaining: bigint, right: bigint): bigint | null {
    const diff = remaining - right;
    // Calibration operands are positive (>= 1n), so a zero/negative prefix is invalid.
    if (diff <= 0n) return null;
    const scale = decimalScale(right);
    return diff % scale === 0n ? diff / scale : null;
  },
  explainPrune(remaining: bigint, right: bigint): string {
    return remaining <= right ? `${remaining} <= ${right}` : `${remaining} !ends ${right}`;
  },
});

/** Part 2 tries `*`, then `||`, then `+` so restrictive branches prune early. */
export const PART2_OPERATORS: readonly CalibrationOperator[] = Object.freeze([
  MUL_OPERATOR,
  CONCAT_OPERATOR,
  ADD_OPERATOR,
]);
