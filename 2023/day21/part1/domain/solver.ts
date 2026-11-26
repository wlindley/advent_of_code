import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  buildGardenTrace,
  countFiniteReachable,
  type GardenMap,
  type GardenTraceFrame,
  parseGardenMap,
} from '../../shared';

export const PART1_STEPS = 64;

/** AoC 2023 Day 21 Part 1 solver: counts finite-grid plots reachable in exactly 64 steps. */
export const solver: PuzzleSolver<GardenMap, number, GardenTraceFrame> = {
  parse(raw: string): GardenMap {
    return parseGardenMap(raw);
  },

  solve(map: GardenMap): number {
    return countFiniteReachable(map, PART1_STEPS);
  },

  trace(map: GardenMap, options?: TraceOptions): readonly GardenTraceFrame[] {
    return buildGardenTrace(map, PART1_STEPS, options);
  },
};
