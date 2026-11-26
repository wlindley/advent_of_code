import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  buildRockTrace,
  type Hailstone,
  parseHailstones,
  type RockTraceFrame,
  solveRockTrajectory,
} from '../../shared';

/** AoC 2023 Day 24 Part 2 solver: recovers the exact integer 3D rock throw and collision sum. */
export const solver: Required<PuzzleSolver<readonly Hailstone[], bigint, RockTraceFrame>> = {
  parse(raw: string): readonly Hailstone[] {
    return parseHailstones(raw);
  },

  solve(hailstones: readonly Hailstone[]): bigint {
    return solveRockTrajectory(hailstones).positionSum;
  },

  trace(hailstones: readonly Hailstone[], options?: TraceOptions): readonly RockTraceFrame[] {
    return buildRockTrace(solveRockTrajectory(hailstones), options);
  },
};
