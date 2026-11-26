import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  computePassword,
  FlatTorusTopology,
  parseMonkeyMap,
  traceMonkeyMap,
  walkMonkeyMap,
  type MonkeyMapInput,
  type MonkeyMapTraceFrame,
} from '../../shared';

/** Pure TypeScript Part 1 solver walking the Monkey Map under flat-torus wrapping. */
export const solver: Required<PuzzleSolver<MonkeyMapInput, number, MonkeyMapTraceFrame>> = {
  parse: parseMonkeyMap,
  solve(input: MonkeyMapInput): number {
    return computePassword(walkMonkeyMap(input, new FlatTorusTopology(input.board)));
  },
  trace(input: MonkeyMapInput, options?: TraceOptions): readonly MonkeyMapTraceFrame[] {
    return traceMonkeyMap(input, new FlatTorusTopology(input.board), options);
  },
};
