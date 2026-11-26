/**
 * Reversible left-to-right calibration operator supporting forward evaluation
 * and exact reverse-DFS inversion for Bridge Repair equations.
 */
export interface CalibrationOperator {
  readonly id: string;
  readonly symbol: string;
  readonly label: string;
  apply(left: bigint, right: bigint): bigint;
  tryInvert(remaining: bigint, right: bigint): bigint | null;
  explainPrune(remaining: bigint, right: bigint): string;
}

export const ADD_OPERATOR: CalibrationOperator = Object.freeze({
  id: 'add',
  symbol: '+',
  label: 'Add',
  apply(left: bigint, right: bigint): bigint {
    return left + right;
  },
  tryInvert(remaining: bigint, right: bigint): bigint | null {
    const prev = remaining - right;
    return prev >= 1n ? prev : null;
  },
  explainPrune(remaining: bigint, right: bigint): string {
    return `${remaining} - ${right} = ${remaining - right} < 1`;
  },
});

export const MUL_OPERATOR: CalibrationOperator = Object.freeze({
  id: 'mul',
  symbol: '*',
  label: 'Multiply',
  apply(left: bigint, right: bigint): bigint {
    return left * right;
  },
  tryInvert(remaining: bigint, right: bigint): bigint | null {
    return remaining % right === 0n ? remaining / right : null;
  },
  explainPrune(remaining: bigint, right: bigint): string {
    return `${remaining} mod ${right} = ${remaining % right}`;
  },
});

/** Part 1 tries multiplication before addition so non-divisible branches prune early. */
export const PART1_OPERATORS: readonly CalibrationOperator[] = Object.freeze([
  MUL_OPERATOR,
  ADD_OPERATOR,
]);
