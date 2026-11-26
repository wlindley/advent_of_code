import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  computePassword,
  CubeNetTopology,
  parseMonkeyMap,
  traceMonkeyMap,
  walkMonkeyMap,
  type MonkeyMapInput,
  type MonkeyMapTraceFrame,
} from '../../shared';

/** Pure TypeScript Part 2 solver walking the Monkey Map folded into a 3D cube net. */
export const solver: Required<PuzzleSolver<MonkeyMapInput, number, MonkeyMapTraceFrame>> = {
  parse: parseMonkeyMap,
  solve(input: MonkeyMapInput): number {
    return computePassword(walkMonkeyMap(input, new CubeNetTopology(input.board)));
  },
  trace(input: MonkeyMapInput, options?: TraceOptions): readonly MonkeyMapTraceFrame[] {
    return traceMonkeyMap(input, new CubeNetTopology(input.board), options);
  },
};
