import type { TraceOptions } from '../../../../shared/core';
import {
  MotionPlan,
  countVisitedTailCells,
  traceRopeBridge,
  type RopeBridgeSolver,
} from '../../shared';

export const PART2_KNOT_COUNT = 10;

export const solver: RopeBridgeSolver = Object.freeze({
  parse: MotionPlan.parse,
  solve: (plan: MotionPlan) => countVisitedTailCells(plan, PART2_KNOT_COUNT),
  trace: (plan: MotionPlan, options?: TraceOptions) => traceRopeBridge(plan, PART2_KNOT_COUNT, options),
});
