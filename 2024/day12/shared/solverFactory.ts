import type { PuzzleSolver, TraceOptions } from '../../../shared/core';
import {
  evaluateTotalFenceCost,
  type GardenTraceFrame,
  type RegionFenceMetric,
  traceGardenGroups,
} from './fence';
import { type GardenMap, parseGardenMap } from './map';

/** Creates a frozen `PuzzleSolver` evaluating garden regions under `metric`. */
export function createGardenGroupsSolver(
  metric: RegionFenceMetric,
): PuzzleSolver<GardenMap, number, GardenTraceFrame> {
  return Object.freeze({
    parse: (raw: string): GardenMap => parseGardenMap(raw),
    solve: (map: GardenMap): number => evaluateTotalFenceCost(map, metric),
    trace: (map: GardenMap, options?: TraceOptions): readonly GardenTraceFrame[] =>
      traceGardenGroups(map, metric, options),
  });
}
