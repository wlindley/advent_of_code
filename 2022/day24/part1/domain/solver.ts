import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  type BasinFrame,
  type BlizzardBasin,
  PART1_WAYPOINTS,
  parseBasin,
  solveTrip,
  traceTrip,
} from '../../shared';

/** Pure TypeScript Part 1 solver finding the shortest Start -> End Blizzard Basin crossing. */
export const solver: Required<PuzzleSolver<BlizzardBasin, number, BasinFrame>> = {
  parse: parseBasin,
  solve(basin: BlizzardBasin): number {
    return solveTrip(basin, PART1_WAYPOINTS).totalMinutes;
  },
  trace(basin: BlizzardBasin, options?: TraceOptions): readonly BasinFrame[] {
    return traceTrip(basin, PART1_WAYPOINTS, options);
  },
};
