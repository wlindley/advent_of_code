import { sampleTraceIndices, validateMaxSteps, type TraceOptions } from '../../../shared/core';
import { applyFold, type FoldOutcome } from './folder';
import type { DotSheet, OrigamiManual } from './models';
import type { OrigamiPolicy } from './policy';

export const DEFAULT_TRACE_MAX_STEPS = 60;

/** Discriminated trace frame representing either the initial sheet or a completed fold. */
export type OrigamiTraceFrame =
  | {
      readonly kind: 'initial';
      readonly foldsApplied: 0;
      readonly sheet: DotSheet;
    }
  | {
      readonly kind: 'folded';
      readonly foldsApplied: number;
      readonly outcome: FoldOutcome;
    };

/** Returns the active `DotSheet` for any trace frame. */
export function frameSheet(frame: OrigamiTraceFrame): DotSheet {
  return frame.kind === 'initial' ? frame.sheet : frame.outcome.sheet;
}

/** Streams folding steps and retains uniformly sampled frames up to `maxSteps`. */
export function captureOrigamiTrace<TAnswer>(
  manual: OrigamiManual,
  policy: OrigamiPolicy<TAnswer>,
  options?: TraceOptions,
): readonly OrigamiTraceFrame[] {
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_TRACE_MAX_STEPS);
  const targetFolds = policy.foldCount(manual);
  const indices = sampleTraceIndices(targetFolds + 1, limit);
  const frames: OrigamiTraceFrame[] = [];
  let nextSample = 0;

  if (indices[nextSample] === 0) {
    frames.push(Object.freeze({ kind: 'initial', foldsApplied: 0, sheet: manual.initialSheet }));
    nextSample += 1;
  }

  let current = manual.initialSheet;
  for (let step = 1; step <= targetFolds; step += 1) {
    const outcome = applyFold(current, manual.folds[step - 1]!);
    current = outcome.sheet;
    if (indices[nextSample] === step) {
      frames.push(Object.freeze({ kind: 'folded', foldsApplied: step, outcome }));
      nextSample += 1;
    }
  }

  return Object.freeze(frames);
}
