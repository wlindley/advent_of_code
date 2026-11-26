import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  type BasinFrame,
  type BlizzardBasin,
  PART2_WAYPOINTS,
  parseBasin,
  solveTrip,
  traceTrip,
} from '../../shared';

/** Pure TypeScript Part 2 solver finding the shortest Start -> End -> Start -> End trip. */
export const solver: Required<PuzzleSolver<BlizzardBasin, number, BasinFrame>> = {
  parse: parseBasin,
  solve(basin: BlizzardBasin): number {
    return solveTrip(basin, PART2_WAYPOINTS).totalMinutes;
  },
  trace(basin: BlizzardBasin, options?: TraceOptions): readonly BasinFrame[] {
    return traceTrip(basin, PART2_WAYPOINTS, options);
  },
};
