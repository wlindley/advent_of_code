import type { PuzzleSolver, TraceOptions } from '../../../shared/core';
import { type DigPlanDecoder, parseDigPlan } from './digPlan';
import { LagoonPolygon } from './lagoonPolygon';
import { buildLagoonTrace, type LagoonTraceFrame } from './lagoonTrace';

/** Builds a Day 18 solver parameterized by a Part 1 or Part 2 `DigPlanDecoder`. */
export function createLagoonSolver(
  decoder: DigPlanDecoder,
): PuzzleSolver<LagoonPolygon, bigint, LagoonTraceFrame> {
  return {
    parse: (raw: string): LagoonPolygon => {
      const entries = parseDigPlan(raw);
      return LagoonPolygon.fromSteps(entries.map((entry) => decoder.decodeStep(entry)));
    },
    solve: (polygon: LagoonPolygon): bigint => polygon.totalVolume,
    trace: (polygon: LagoonPolygon, options?: TraceOptions): readonly LagoonTraceFrame[] =>
      buildLagoonTrace(polygon, options),
  };
}
