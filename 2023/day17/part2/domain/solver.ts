import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  CrucibleRouter,
  type CrucibleTraceFrame,
  type HeatMap,
  parseHeatMap,
  ULTRA_CRUCIBLE_RULE,
} from '../../shared';

const router = new CrucibleRouter(ULTRA_CRUCIBLE_RULE);

/** AoC 2023 Day 17 Part 2 solver: minimum heat loss for an ultra crucible (4–10 blocks). */
export const solver: PuzzleSolver<HeatMap, number, CrucibleTraceFrame> = {
  parse: parseHeatMap,
  solve: (map: HeatMap): number => router.search(map).goalHeat,
  trace: (map: HeatMap, options?: TraceOptions): readonly CrucibleTraceFrame[] =>
    router.trace(map, options),
};
