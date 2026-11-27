import type { PuzzleSolver, TraceOptions } from '../../../shared/core';
import { analyzeTargetArea, type TrickShotAnalysis } from './analyzer';
import type { TrickShotPolicy } from './policy';
import { parseTargetArea, type TargetArea } from './target';
import { traceTrickShot, type TrickShotTraceFrame } from './trace';

/** Parameterizable solver for 2021 Day 17 Trick Shot (Part 1 = max apex, Part 2 = valid count). */
export class TrickShotSolver
  implements Required<PuzzleSolver<TargetArea, number, TrickShotTraceFrame>>
{
  constructor(readonly policy: TrickShotPolicy) {
    Object.freeze(this);
  }

  parse(raw: string): TargetArea {
    return parseTargetArea(raw);
  }

  analyze(input: TargetArea): TrickShotAnalysis {
    return analyzeTargetArea(input);
  }

  solve(input: TargetArea): number {
    return this.policy.compute(this.analyze(input));
  }

  trace(input: TargetArea, options?: TraceOptions): readonly TrickShotTraceFrame[] {
    return traceTrickShot(this.analyze(input), this.policy, options);
  }

  formatAnswer(answer: number): string {
    return String(answer);
  }
}
