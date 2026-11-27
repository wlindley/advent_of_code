export type BinaryOperator = '+' | '*';

export type PrecedencePolicyId = 'equal' | 'add-before-mul';

export interface PrecedencePolicy {
  readonly id: PrecedencePolicyId;
  readonly label: string;
  readonly precedence: Readonly<Record<BinaryOperator, number>>;
}

export const DEFAULT_MAX_TRACE_STEPS = 120;

export const EQUAL_PRECEDENCE_POLICY: PrecedencePolicy = Object.freeze({
  id: 'equal',
  label: 'Equal Precedence (+ = *)',
  precedence: Object.freeze({ '+': 1, '*': 1 }),
});

export const ADD_BEFORE_MUL_POLICY: PrecedencePolicy = Object.freeze({
  id: 'add-before-mul',
  label: 'Addition First (+ > *)',
  precedence: Object.freeze({ '+': 2, '*': 1 }),
});

const OPERATOR_EVAL: Readonly<Record<BinaryOperator, (left: bigint, right: bigint) => bigint>> = Object.freeze({
  '+': (left, right) => left + right,
  '*': (left, right) => left * right,
});

/** Evaluates a single binary operator using exact BigInt arithmetic. */
export function applyBinaryOperator(op: BinaryOperator, left: bigint, right: bigint): bigint {
  return OPERATOR_EVAL[op](left, right);
}
