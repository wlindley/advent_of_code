import type { PuzzleSolver, TraceOptions } from '../../../shared/core';
import { parseReactionNetwork, type ReactionNetwork } from './models';
import type { StoichiometryPolicy } from './policies';
import type { StoichiometryTraceFrame } from './trace';

/** Shared PuzzleSolver implementation parameterized by a StoichiometryPolicy. */
export class StoichiometrySolver<TTrace extends StoichiometryTraceFrame>
  implements PuzzleSolver<ReactionNetwork, bigint, TTrace>
{
  readonly policy: StoichiometryPolicy<bigint, TTrace>;

  constructor(policy: StoichiometryPolicy<bigint, TTrace>) {
    this.policy = policy;
    Object.freeze(this);
  }

  parse(raw: string): ReactionNetwork {
    return parseReactionNetwork(raw);
  }

  solve(network: ReactionNetwork): bigint {
    return this.policy.solve(network);
  }

  trace(network: ReactionNetwork, options?: TraceOptions): readonly TTrace[] {
    return this.policy.trace(network, options?.maxSteps);
  }
}
