import type { TraceOptions } from '../../../../shared/core';
import {
  MotionPlan,
  countVisitedTailCells,
  traceRopeBridge,
  type RopeBridgeSolver,
} from '../../shared';

export const PART1_KNOT_COUNT = 2;

export const solver: RopeBridgeSolver = Object.freeze({
  parse: (raw: string) => MotionPlan.parse(raw),
  solve: (plan: MotionPlan) => countVisitedTailCells(plan, PART1_KNOT_COUNT),
  trace: (plan: MotionPlan, options?: TraceOptions) => traceRopeBridge(plan, PART1_KNOT_COUNT, options),
});
