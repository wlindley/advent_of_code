import { validateMaxSteps, type PuzzleSolver, type TraceOptions } from '../../../shared/core';
import { simulateCombat, simulateCombatTrace } from './engine';
import { parseCombatDecks, type CombatDecks } from './model';
import type { CombatPolicy } from './policies';
import { DEFAULT_MAX_TRACE_STEPS, type CombatTraceFrame } from './trace';

/** Shared PuzzleSolver adapter binding a CombatPolicy to the Crab Combat simulation engine. */
export class CombatSolver implements PuzzleSolver<CombatDecks, number, CombatTraceFrame> {
  readonly policy: CombatPolicy;

  constructor(policy: CombatPolicy) {
    this.policy = policy;
    Object.freeze(this);
  }

  parse(raw: string): CombatDecks {
    return parseCombatDecks(raw);
  }

  solve(input: CombatDecks): number {
    return simulateCombat(input, this.policy.recursive).score;
  }

  trace(input: CombatDecks, options?: TraceOptions): readonly CombatTraceFrame[] {
    const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
    return simulateCombatTrace(input, this.policy.recursive, maxSteps);
  }
}
