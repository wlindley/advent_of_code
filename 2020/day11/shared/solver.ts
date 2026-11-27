import { validateMaxSteps, type PuzzleSolver, type TraceOptions } from '../../../shared/core';
import { parseSeatingLayout, type SeatingLayout } from './layout';
import type { SeatingRule } from './rules';
import { simulateSeating } from './simulation';
import {
  DEFAULT_MAX_TRACE_STEPS,
  type SeatingTraceFrame,
  traceSeating,
} from './trace';

/** Shared Day 11 PuzzleSolver parameterized by a SeatingRule strategy. */
export class SeatingSystemSolver
  implements Required<PuzzleSolver<SeatingLayout, number, SeatingTraceFrame>>
{
  readonly rule: SeatingRule;

  constructor(rule: SeatingRule) {
    this.rule = rule;
    Object.freeze(this);
  }

  parse(raw: string): SeatingLayout {
    return parseSeatingLayout(raw);
  }

  solve(layout: SeatingLayout): number {
    return simulateSeating(layout, this.rule).occupiedCount;
  }

  trace(layout: SeatingLayout, options?: TraceOptions): readonly SeatingTraceFrame[] {
    const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
    return traceSeating(layout, this.rule, maxSteps);
  }
}
