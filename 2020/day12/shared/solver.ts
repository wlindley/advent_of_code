import { validateMaxSteps, type PuzzleSolver, type TraceOptions } from '../../../shared/core';
import { NavigationInstruction, parseNavigationInstructions } from './model';
import { simulateNavigation, type NavigationRule } from './rules';
import { DEFAULT_MAX_TRACE_STEPS, NavigationTraceFrame, traceNavigation } from './trace';

/** Shared PuzzleSolver implementation parameterized by a Day 12 NavigationRule. */
export class RainRiskSolver
  implements Required<PuzzleSolver<readonly NavigationInstruction[], bigint, NavigationTraceFrame>>
{
  readonly rule: NavigationRule;

  constructor(rule: NavigationRule) {
    this.rule = rule;
    Object.freeze(this);
  }

  /** Parses raw puzzle input into validated navigation instructions. */
  parse(raw: string): readonly NavigationInstruction[] {
    return parseNavigationInstructions(raw);
  }

  /** Simulates the full voyage and returns final Manhattan distance from origin. */
  solve(input: readonly NavigationInstruction[]): bigint {
    return simulateNavigation(input, this.rule).manhattanDistance;
  }

  /** Produces a bounded visualization trace for the supplied instructions. */
  trace(
    input: readonly NavigationInstruction[],
    options?: TraceOptions,
  ): readonly NavigationTraceFrame[] {
    const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
    return traceNavigation(input, this.rule, maxSteps);
  }
}
