import type { PuzzleSolver, TraceOptions } from '../../../shared/core';
import { BagRuleGraph, parseBagRuleGraph } from './graph';
import { BagQueryPolicy } from './policy';
import { validateBagColor } from './rule';
import { BagTraceFrame, traceBagQuery } from './trace';

/** Pure PuzzleSolver parameterized by a BagQueryPolicy and target color. */
export class HaversackSolver implements Required<PuzzleSolver<BagRuleGraph, bigint, BagTraceFrame>> {
  readonly policy: BagQueryPolicy;
  readonly targetColor: string;

  constructor(policy: BagQueryPolicy, targetColor: string) {
    this.policy = policy;
    this.targetColor = validateBagColor(targetColor);
    Object.freeze(this);
  }

  parse(raw: string): BagRuleGraph {
    return parseBagRuleGraph(raw);
  }

  solve(input: BagRuleGraph): bigint {
    return this.policy.evaluate(input, this.targetColor);
  }

  trace(input: BagRuleGraph, options?: TraceOptions): readonly BagTraceFrame[] {
    return traceBagQuery(input, this.policy, this.targetColor, options?.maxSteps);
  }
}
