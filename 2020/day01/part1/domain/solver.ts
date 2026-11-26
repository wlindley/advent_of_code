import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  ExpenseReport, findKSumTuple, KSumTraceFrame, parseExpenseReport, TARGET_EXPENSE_SUM, traceKSumSearch,
} from '../../shared';

const PART1_TUPLE_SIZE = 2;

export const solver: PuzzleSolver<ExpenseReport, number, KSumTraceFrame> = {
  parse(raw: string): ExpenseReport {
    return parseExpenseReport(raw);
  },
  solve(report: ExpenseReport): number {
    const match = findKSumTuple(report, PART1_TUPLE_SIZE, TARGET_EXPENSE_SUM);
    if (!match) throw new RangeError(`No ${PART1_TUPLE_SIZE} expenses sum to ${TARGET_EXPENSE_SUM}`);
    return match.product;
  },
  trace(report: ExpenseReport, options?: TraceOptions): readonly KSumTraceFrame[] {
    return traceKSumSearch(report, PART1_TUPLE_SIZE, TARGET_EXPENSE_SUM, options?.maxSteps);
  },
};
