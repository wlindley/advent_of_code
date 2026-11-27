import { type PuzzleSolver, type TraceOptions, validateMaxSteps } from '../../../shared/core';
import { type HomeworkProgram, parseHomework } from './parser';
import { DEFAULT_MAX_TRACE_STEPS, type PrecedencePolicy } from './policies';
import { type OperationTraceFrame, traceHomework } from './trace';

/** Shared Operation Order solver parameterized by an operator PrecedencePolicy. */
export class OperationOrderSolver implements Required<PuzzleSolver<HomeworkProgram, bigint, OperationTraceFrame>> {
  readonly policy: PrecedencePolicy;

  constructor(policy: PrecedencePolicy) {
    this.policy = policy;
    Object.freeze(this);
  }

  parse(raw: string): HomeworkProgram {
    return parseHomework(raw, this.policy);
  }

  solve(input: HomeworkProgram): bigint {
    return input.evaluateSum();
  }

  trace(input: HomeworkProgram, options?: TraceOptions): readonly OperationTraceFrame[] {
    const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
    return traceHomework(input, limit);
  }
}
