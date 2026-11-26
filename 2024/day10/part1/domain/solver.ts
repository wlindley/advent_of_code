import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  evaluateTotalMetric,
  parseTopographicMap,
  traceTrailheads,
  type TopographicMap,
  type TrailheadTraceFrame,
} from '../../shared';
import { SCORE_METRIC } from './metric';

/** Computes the total trailhead score across all `0`-height trailheads in `map`. */
export function solveHoofItPart1(map: TopographicMap): number {
  return evaluateTotalMetric(map, SCORE_METRIC);
}

/** Captures uniformly sampled trailhead exploration frames for Part 1 scoring. */
export function traceHoofItPart1(
  map: TopographicMap,
  options?: TraceOptions,
): readonly TrailheadTraceFrame[] {
  return traceTrailheads(map, SCORE_METRIC, options);
}

/** Pure puzzle solver for Advent of Code 2024 Day 10 Part 1. */
export const solver: PuzzleSolver<TopographicMap, number, TrailheadTraceFrame> = Object.freeze({
  parse: parseTopographicMap,
  solve: solveHoofItPart1,
  trace: traceHoofItPart1,
});
