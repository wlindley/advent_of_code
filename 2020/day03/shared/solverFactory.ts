import type { PuzzleSolver, TraceOptions } from '../../../shared/core';
import { ForestMap, parseForestMap } from './forest';
import { Slope, validateSlopes } from './slope';
import { traceTrajectories } from './trace';
import { TrajectoryTraceFrame } from './traceModels';
import { multiplySlopeTreeCounts } from './trajectory';

/** Builds a `PuzzleSolver` bound to a validated, frozen slope configuration. */
export function createTobogganSolver(
  slopes: readonly Slope[],
): PuzzleSolver<ForestMap, bigint, TrajectoryTraceFrame> {
  const validSlopes = validateSlopes(slopes);
  return {
    parse(raw: string): ForestMap {
      return parseForestMap(raw);
    },
    solve(forest: ForestMap): bigint {
      return multiplySlopeTreeCounts(forest, validSlopes);
    },
    trace(forest: ForestMap, options?: TraceOptions): readonly TrajectoryTraceFrame[] {
      return traceTrajectories(forest, validSlopes, options?.maxSteps);
    },
  };
}
