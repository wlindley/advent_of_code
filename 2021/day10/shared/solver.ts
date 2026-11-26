import { validateMaxSteps, type PuzzleSolver, type TraceOptions } from '../../../shared/core';
import { analyzeSyntax } from './analysis';
import { parseNavigationSubsystem } from './parser';
import type { SyntaxScoringPolicy } from './policy';
import { DEFAULT_MAX_TRACE_STEPS, type SyntaxTraceFrame } from './trace';

/** Parameterized `PuzzleSolver` delegating evaluation and trace generation to a `SyntaxScoringPolicy`. */
export class SyntaxScoringSolver<TTrace extends SyntaxTraceFrame = SyntaxTraceFrame>
  implements Required<PuzzleSolver<readonly string[], bigint, TTrace>>
{
  readonly policy: SyntaxScoringPolicy<TTrace>;

  constructor(policy: SyntaxScoringPolicy<TTrace>) {
    this.policy = policy;
    Object.freeze(this);
  }

  parse(raw: string): readonly string[] {
    return parseNavigationSubsystem(raw);
  }

  solve(lines: readonly string[]): bigint {
    return this.policy.evaluate(analyzeSyntax(lines));
  }

  trace(lines: readonly string[], options?: TraceOptions): readonly TTrace[] {
    const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
    return this.policy.trace(analyzeSyntax(lines), maxSteps);
  }
}
