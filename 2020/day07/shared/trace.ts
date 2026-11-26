import { sampleTraceIndices, validateMaxSteps } from '../../../shared/core';
import { BagRuleGraph } from './graph';
import { BagLayer, BagQueryPolicy, BagQueryPolicyId } from './policy';
import { validateBagColor } from './rule';

export const DEFAULT_MAX_TRACE_STEPS = 32;

function requireIntAtLeast(value: number, min: number, label: string): number {
  if (!Number.isInteger(value) || value < min) {
    throw new RangeError(`${label} must be an integer >= ${min}, got ${value}`);
  }
  return value;
}

/** Immutable progressive trace frame revealing layers up to `revealedDepth`. */
export class BagTraceFrame {
  readonly targetColor: string;
  readonly policyId: BagQueryPolicyId;
  readonly revealedDepth: number;
  readonly totalLayers: number;
  readonly layers: readonly BagLayer[];
  readonly totalRuleCount: number;

  constructor(
    targetColor: string,
    policyId: BagQueryPolicyId,
    revealedDepth: number,
    totalLayers: number,
    layers: readonly BagLayer[],
    totalRuleCount: number,
  ) {
    this.targetColor = validateBagColor(targetColor);
    this.policyId = policyId;
    this.revealedDepth = requireIntAtLeast(revealedDepth, 0, 'revealedDepth');
    this.totalLayers = requireIntAtLeast(totalLayers, 0, 'totalLayers');
    this.layers = Object.freeze([...layers]);
    this.totalRuleCount = requireIntAtLeast(totalRuleCount, 1, 'totalRuleCount');
    Object.freeze(this);
  }

  get targetPresent(): boolean {
    return this.totalLayers > 0;
  }

  get activeLayer(): BagLayer | undefined {
    return this.layers[this.layers.length - 1];
  }

  get runningTotal(): bigint {
    let total = 0n;
    for (let i = 1; i < this.layers.length; i += 1) {
      total += this.layers[i]!.totalWeight;
    }
    return total;
  }

  get discoveredNodeCount(): number {
    let count = 0;
    for (const layer of this.layers) count += layer.nodeCount;
    return count;
  }
}

/** Traces progressive layer discovery for a bag query, capped at `maxSteps`. */
export function traceBagQuery(
  graph: BagRuleGraph,
  policy: BagQueryPolicy,
  targetColor: string,
  maxSteps: number | undefined,
): readonly BagTraceFrame[] {
  const limit = validateMaxSteps(maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const allLayers = policy.buildLayers(graph, targetColor);
  if (allLayers.length === 0) {
    return Object.freeze([
      new BagTraceFrame(targetColor, policy.id, 0, 0, [], graph.colorCount),
    ]);
  }
  const indices = sampleTraceIndices(allLayers.length, limit);
  return Object.freeze(
    indices.map(
      (idx) =>
        new BagTraceFrame(
          targetColor,
          policy.id,
          idx,
          allLayers.length,
          allLayers.slice(0, idx + 1),
          graph.colorCount,
        ),
    ),
  );
}
