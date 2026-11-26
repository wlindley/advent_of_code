import { sampleTraceIndices, validateMaxSteps, type PuzzleSolver, type TraceOptions } from '../../../../shared/core';
import {
  parseLabMap,
  simulatePatrol,
  type LabMap,
  type PatrolOutcome,
  type PatrolStep,
} from '../../shared';

export const DEFAULT_MAX_TRACE_STEPS = 250;

export interface GuardTraceFrame {
  readonly stepIndex: number;
  readonly totalSteps: number;
  readonly step: PatrolStep;
  readonly visitedCount: number;
  readonly turnCount: number;
  readonly outcome: PatrolOutcome;
}

/** Counts distinct positions visited before the guard exits the mapped area. */
export function countVisitedPositions(map: LabMap): number {
  const result = simulatePatrol(map);
  if (result.outcome === 'loop') {
    throw new Error('Guard entered a patrol loop and never exited the lab');
  }
  return result.visitedCount;
}

function freezeFrame(
  stepIndex: number,
  totalSteps: number,
  step: PatrolStep,
  visitedCount: number,
  turnCount: number,
  outcome: PatrolOutcome,
): GuardTraceFrame {
  return Object.freeze({ stepIndex, totalSteps, step, visitedCount, turnCount, outcome });
}

/** Records a uniformly sampled patrol trace capped at `options.maxSteps` frames. */
export function tracePatrol(map: LabMap, options?: TraceOptions): readonly GuardTraceFrame[] {
  const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const { outcome, steps } = simulatePatrol(map, { recordSteps: true });
  const indices = sampleTraceIndices(steps.length, maxSteps);
  const seen = new Uint8Array(map.size);
  const frames: GuardTraceFrame[] = [];
  let visitedCount = 0;
  let turnCount = 0;
  let cursor = 0;

  for (let i = 0; i < steps.length; i += 1) {
    const step = steps[i]!;
    const idx = step.row * map.cols + step.col;
    if (seen[idx]! === 0) {
      seen[idx] = 1;
      visitedCount += 1;
    }
    if (step.action === 'turn') turnCount += 1;
    if (i === indices[cursor]) {
      frames.push(freezeFrame(i, steps.length, step, visitedCount, turnCount, outcome));
      cursor += 1;
    }
  }
  return Object.freeze(frames);
}

export const solver: PuzzleSolver<LabMap, number, GuardTraceFrame> = Object.freeze({
  parse: parseLabMap,
  solve: countVisitedPositions,
  trace: tracePatrol,
});
