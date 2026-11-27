import { validateMaxSteps, type PuzzleSolver, type TraceOptions } from '../../../shared/core';
import { type AllergenDocument, parseAllergenDocument } from './model';
import type { AllergenPolicy } from './policies';
import { DEFAULT_MAX_TRACE_STEPS } from './traceFrames';

/** Policy-parameterized solver for AoC 2020 Day 21 (Allergen Assessment). */
export class AllergenAssessmentSolver<TAnswer, TTrace>
  implements PuzzleSolver<AllergenDocument, TAnswer, TTrace>
{
  readonly policy: AllergenPolicy<TAnswer, TTrace>;

  constructor(policy: AllergenPolicy<TAnswer, TTrace>) {
    this.policy = policy;
    Object.freeze(this);
  }

  parse(raw: string): AllergenDocument {
    return parseAllergenDocument(raw);
  }

  solve(input: AllergenDocument): TAnswer {
    return this.policy.solve(input);
  }

  trace(input: AllergenDocument, options?: TraceOptions): readonly TTrace[] {
    const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
    return this.policy.trace(input, maxSteps);
  }
}
