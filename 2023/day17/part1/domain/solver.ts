import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  CLUMSY_CRUCIBLE_RULE,
  CrucibleRouter,
  type CrucibleTraceFrame,
  type HeatMap,
  parseHeatMap,
} from '../../shared';

const router = new CrucibleRouter(CLUMSY_CRUCIBLE_RULE);

/** AoC 2023 Day 17 Part 1 solver: minimum heat loss for a clumsy crucible (1–3 blocks). */
export const solver: PuzzleSolver<HeatMap, number, CrucibleTraceFrame> = {
  parse: parseHeatMap,
  solve: (map: HeatMap): number => router.search(map).goalHeat,
  trace: (map: HeatMap, options?: TraceOptions): readonly CrucibleTraceFrame[] =>
    router.trace(map, options),
};
