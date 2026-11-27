import { validateMaxSteps, type PuzzleSolver, type TraceOptions } from '../../../shared/core';
import { simulateCrabCups, simulateCrabCupsTrace } from './engine';
import { parseCupLabels, type CupRingSpec } from './model';
import type { CrabCupsPolicy } from './policies';
import { DEFAULT_MAX_TRACE_STEPS, type CrabCupsTraceFrame } from './trace';

/** Shared PuzzleSolver adapter binding a CrabCupsPolicy to the cup-ring simulation engine. */
export class CrabCupsSolver<TAnswer extends string | bigint = string | bigint>
  implements PuzzleSolver<CupRingSpec, TAnswer, CrabCupsTraceFrame>
{
  readonly policy: CrabCupsPolicy<TAnswer>;

  constructor(policy: CrabCupsPolicy<TAnswer>) {
    this.policy = policy;
    Object.freeze(this);
  }

  parse(raw: string): CupRingSpec {
    return parseCupLabels(raw);
  }

  solve(input: CupRingSpec): TAnswer {
    return simulateCrabCups(input, this.policy);
  }

  trace(input: CupRingSpec, options?: TraceOptions): readonly CrabCupsTraceFrame[] {
    const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
    return simulateCrabCupsTrace(input, this.policy, maxSteps);
  }
}
