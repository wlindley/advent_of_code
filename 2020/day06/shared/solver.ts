import type { PuzzleSolver, TraceOptions } from '../../../shared/core';
import { CustomsBatch, parseCustomsBatch } from './declaration';
import { GroupConsensusPolicy, sumGroupConsensus } from './policy';
import { CustomsTraceFrame, traceCustomsBatch } from './trace';

/** Parameterized Day 6 customs solver bound to a specific `GroupConsensusPolicy`. */
export class CustomsSolver implements Required<PuzzleSolver<CustomsBatch, number, CustomsTraceFrame>> {
  readonly policy: GroupConsensusPolicy;

  constructor(policy: GroupConsensusPolicy) {
    this.policy = policy;
    Object.freeze(this);
  }

  parse(raw: string): CustomsBatch {
    return parseCustomsBatch(raw);
  }

  solve(batch: CustomsBatch): number {
    return sumGroupConsensus(batch, this.policy);
  }

  trace(batch: CustomsBatch, options?: TraceOptions): readonly CustomsTraceFrame[] {
    return traceCustomsBatch(batch, this.policy, options?.maxSteps);
  }
}
