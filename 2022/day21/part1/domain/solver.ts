import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  buildEvaluationTrace,
  DEFAULT_ROOT_NAME,
  type MonkeyRiddle,
  type MonkeyTraceFrame,
  parseMonkeyRiddle,
  solveRootYell,
} from '../../shared';

/** Pure TypeScript Part 1 solver evaluating the monkey math expression DAG bottom-up. */
export const solver: Required<PuzzleSolver<MonkeyRiddle, bigint, MonkeyTraceFrame>> = {
  parse: parseMonkeyRiddle,
  solve(riddle: MonkeyRiddle): bigint {
    return solveRootYell(riddle, DEFAULT_ROOT_NAME);
  },
  trace(riddle: MonkeyRiddle, options?: TraceOptions): readonly MonkeyTraceFrame[] {
    return buildEvaluationTrace(riddle, DEFAULT_ROOT_NAME, options);
  },
};
