import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  buildEqualitySolveTrace,
  DEFAULT_ROOT_NAME,
  DEFAULT_UNKNOWN_NAME,
  type MonkeyRiddle,
  type MonkeyTraceFrame,
  parseMonkeyRiddle,
  solveEqualityUnknown,
} from '../../shared';

/** Pure TypeScript Part 2 solver finding `humn` such that both sides of `root` match. */
export const solver: Required<PuzzleSolver<MonkeyRiddle, bigint, MonkeyTraceFrame>> = {
  parse: parseMonkeyRiddle,
  solve(riddle: MonkeyRiddle): bigint {
    return solveEqualityUnknown(riddle, DEFAULT_ROOT_NAME, DEFAULT_UNKNOWN_NAME);
  },
  trace(riddle: MonkeyRiddle, options?: TraceOptions): readonly MonkeyTraceFrame[] {
    return buildEqualitySolveTrace(riddle, DEFAULT_ROOT_NAME, DEFAULT_UNKNOWN_NAME, options);
  },
};
