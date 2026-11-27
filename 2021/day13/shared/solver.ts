import type { PuzzleSolver, TraceOptions } from '../../../shared/core';
import { applyFolds } from './folder';
import type { OrigamiManual } from './models';
import { parseOrigamiManual } from './parser';
import type { OrigamiPolicy } from './policy';
import { captureOrigamiTrace, type OrigamiTraceFrame } from './trace';

/** Shared parameterizable puzzle solver for Transparent Origami parts 1 and 2. */
export class OrigamiSolver<TAnswer>
  implements Required<PuzzleSolver<OrigamiManual, TAnswer, OrigamiTraceFrame>>
{
  constructor(readonly policy: OrigamiPolicy<TAnswer>) {
    Object.freeze(this);
  }

  parse(raw: string): OrigamiManual {
    return parseOrigamiManual(raw);
  }

  solve(input: OrigamiManual): TAnswer {
    const folded = applyFolds(input.initialSheet, input.folds, this.policy.foldCount(input));
    return this.policy.extractAnswer(folded);
  }

  trace(input: OrigamiManual, options?: TraceOptions): readonly OrigamiTraceFrame[] {
    return captureOrigamiTrace(input, this.policy, options);
  }
}
