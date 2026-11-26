import { validateMaxSteps, type PuzzleSolver, type TraceOptions } from '../../../shared/core';
import type { XmasAttackPolicy } from './policy';
import { parseXmasStream, type XmasStream } from './stream';
import { DEFAULT_MAX_TRACE_STEPS, type XmasTraceFrame } from './trace';
import { validatePreambleLength } from './window';

/** Shared Day 9 PuzzleSolver parameterized by an XmasAttackPolicy and preamble length. */
export class XmasAttackSolver
  implements Required<PuzzleSolver<XmasStream, bigint, XmasTraceFrame>>
{
  readonly policy: XmasAttackPolicy;
  readonly preambleLength: number;

  constructor(policy: XmasAttackPolicy, preambleLength: number) {
    validatePreambleLength(preambleLength);
    this.policy = policy;
    this.preambleLength = preambleLength;
    Object.freeze(this);
  }

  parse(raw: string): XmasStream {
    return parseXmasStream(raw);
  }

  solve(stream: XmasStream): bigint {
    return this.policy.solve(stream, this.preambleLength);
  }

  trace(stream: XmasStream, options?: TraceOptions): readonly XmasTraceFrame[] {
    const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
    return this.policy.trace(stream, this.preambleLength, maxSteps);
  }
}
