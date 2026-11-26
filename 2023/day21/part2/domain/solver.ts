import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  buildGardenTrace,
  type GardenMap,
  type GardenTraceFrame,
  parseGardenMap,
} from '../../shared';
import { countInfinitePlotsForSteps, PART2_STEPS } from './infiniteGarden';

/** AoC 2023 Day 21 Part 2 solver: counts infinite-grid plots reachable in 26,501,365 steps. */
export const solver: PuzzleSolver<GardenMap, bigint, GardenTraceFrame> = {
  parse(raw: string): GardenMap {
    return parseGardenMap(raw);
  },

  solve(map: GardenMap): bigint {
    return countInfinitePlotsForSteps(map, PART2_STEPS);
  },

  trace(map: GardenMap, options?: TraceOptions): readonly GardenTraceFrame[] {
    return buildGardenTrace(map, Math.max(map.width, map.height), options);
  },
};
