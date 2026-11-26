import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  collectAntinodes,
  parseAntennaMap,
  traceAntinodes,
  type AntennaMap,
  type ResonanceTraceFrame,
} from '../../shared';
import { HARMONIC_LINE_RULE } from './harmonicLineRule';

/** Counts unique in-bounds resonant-harmonic antinodes across all same-frequency pairs. */
export function solvePart2(map: AntennaMap): number {
  return collectAntinodes(map, HARMONIC_LINE_RULE).length;
}

/** Records a bounded step-by-step trace of Part 2 harmonic line projections and antinodes. */
export function tracePart2(map: AntennaMap, options?: TraceOptions): readonly ResonanceTraceFrame[] {
  return traceAntinodes(map, HARMONIC_LINE_RULE, options);
}

/** AoC 2024 Day 8 Part 2 solver contract. */
export const solver: PuzzleSolver<AntennaMap, number, ResonanceTraceFrame> = Object.freeze({
  parse: parseAntennaMap,
  solve: solvePart2,
  trace: tracePart2,
});
