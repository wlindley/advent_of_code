import { validateMaxSteps, type PuzzleSolver, type TraceOptions } from '../../../shared/core';
import { type AdapterChain, parseAdapterChain } from './chain';
import type { AdapterChainPolicy } from './policy';
import { type AdapterTraceFrame, DEFAULT_MAX_TRACE_STEPS } from './trace';

/** Shared Day 10 PuzzleSolver parameterized by an AdapterChainPolicy. */
export class AdapterArraySolver
  implements Required<PuzzleSolver<AdapterChain, bigint, AdapterTraceFrame>>
{
  readonly policy: AdapterChainPolicy;

  constructor(policy: AdapterChainPolicy) {
    this.policy = policy;
    Object.freeze(this);
  }

  parse(raw: string): AdapterChain {
    return parseAdapterChain(raw);
  }

  solve(chain: AdapterChain): bigint {
    return this.policy.solve(chain);
  }

  trace(chain: AdapterChain, options?: TraceOptions): readonly AdapterTraceFrame[] {
    const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
    return this.policy.trace(chain, maxSteps);
  }
}
