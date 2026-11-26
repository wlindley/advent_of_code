import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  findKSumTuple,
  parseExpenseReport,
  TARGET_EXPENSE_SUM,
  traceKSumSearch,
  type ExpenseReport,
  type KSumTraceFrame,
} from '../../shared';

const PART2_TUPLE_SIZE = 3;

export const solver: PuzzleSolver<ExpenseReport, number, KSumTraceFrame> = {
  parse: parseExpenseReport,
  solve(report: ExpenseReport): number {
    const match = findKSumTuple(report, PART2_TUPLE_SIZE, TARGET_EXPENSE_SUM);
    if (!match) {
      throw new RangeError(`No ${PART2_TUPLE_SIZE} expenses sum to ${TARGET_EXPENSE_SUM}`);
    }
    return match.product;
  },
  trace(report: ExpenseReport, options?: TraceOptions): readonly KSumTraceFrame[] {
    return traceKSumSearch(report, PART2_TUPLE_SIZE, TARGET_EXPENSE_SUM, options?.maxSteps);
  },
};
