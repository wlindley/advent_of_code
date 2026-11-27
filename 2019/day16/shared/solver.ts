import { validateMaxSteps, type PuzzleSolver, type TraceOptions } from '../../../shared/core';
import type { FftPolicy } from './policies';
import { parseSignal, Signal } from './signal';
import { DEFAULT_MAX_TRACE_STEPS, type FftTraceFrame } from './trace';

/** Policy-driven Advent of Code 2019 Day 16 FFT solver. */
export class FftSolver implements Required<PuzzleSolver<Signal, string, FftTraceFrame>> {
  readonly policy: FftPolicy;

  constructor(policy: FftPolicy) {
    this.policy = policy;
    Object.freeze(this);
  }

  parse(raw: string): Signal {
    return parseSignal(raw);
  }

  solve(input: Signal): string {
    return this.policy.solve(input);
  }

  trace(input: Signal, options?: TraceOptions): readonly FftTraceFrame[] {
    const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
    return this.policy.trace(input, maxSteps);
  }
}
