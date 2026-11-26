import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  evaluateTotalMetric,
  parseTopographicMap,
  traceTrailheads,
  type TopographicMap,
  type TrailheadTraceFrame,
} from '../../shared';
import { RATING_METRIC } from './metric';

/** Computes the total trailhead rating across all `0`-height trailheads in `map`. */
export function solveHoofItPart2(map: TopographicMap): number {
  return evaluateTotalMetric(map, RATING_METRIC);
}

/** Captures uniformly sampled trailhead exploration frames for Part 2 ratings. */
export function traceHoofItPart2(
  map: TopographicMap,
  options?: TraceOptions,
): readonly TrailheadTraceFrame[] {
  return traceTrailheads(map, RATING_METRIC, options);
}

/** Pure puzzle solver for Advent of Code 2024 Day 10 Part 2. */
export const solver: PuzzleSolver<TopographicMap, number, TrailheadTraceFrame> = Object.freeze({
  parse: parseTopographicMap,
  solve: solveHoofItPart2,
  trace: traceHoofItPart2,
});
