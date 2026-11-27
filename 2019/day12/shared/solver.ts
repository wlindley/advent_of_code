import { validateMaxSteps, type PuzzleSolver, type TraceOptions } from '../../../shared/core';
import { MoonSystem } from './models';
import type { NBodyPolicy } from './policies';
import { DEFAULT_MAX_TRACE_FRAMES } from './trace';

/** Reusable Day 12 PuzzleSolver parameterized by an NBodyPolicy. */
export class NBodySolver<TAnswer, TTrace> implements Required<PuzzleSolver<MoonSystem, TAnswer, TTrace>> {
  readonly policy: NBodyPolicy<TAnswer, TTrace>;

  constructor(policy: NBodyPolicy<TAnswer, TTrace>) {
    this.policy = policy;
    Object.freeze(this);
  }

  parse(raw: string): MoonSystem {
    return MoonSystem.parse(raw);
  }

  solve(input: MoonSystem): TAnswer {
    return this.policy.solve(input);
  }

  trace(input: MoonSystem, options?: TraceOptions): readonly TTrace[] {
    const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_FRAMES);
    return this.policy.trace(input, limit);
  }

  formatAnswer(answer: TAnswer): string {
    return this.policy.formatAnswer(answer);
  }
}
