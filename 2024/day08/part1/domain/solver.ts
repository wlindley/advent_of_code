import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  collectAntinodes,
  parseAntennaMap,
  traceAntinodes,
  type AntennaMap,
  type ResonanceTraceFrame,
} from '../../shared';
import { DOUBLE_DISTANCE_RULE } from './doubleDistanceRule';

/** Counts unique in-bounds double-distance antinode locations across all same-frequency pairs. */
export function solvePart1(map: AntennaMap): number {
  return collectAntinodes(map, DOUBLE_DISTANCE_RULE).length;
}

/** Records a bounded step-by-step trace of Part 1 pair projections and cumulative antinodes. */
export function tracePart1(map: AntennaMap, options?: TraceOptions): readonly ResonanceTraceFrame[] {
  return traceAntinodes(map, DOUBLE_DISTANCE_RULE, options);
}

/** AoC 2024 Day 8 Part 1 solver contract. */
export const solver: PuzzleSolver<AntennaMap, number, ResonanceTraceFrame> = Object.freeze({
  parse: parseAntennaMap,
  solve: solvePart1,
  trace: tracePart1,
});
