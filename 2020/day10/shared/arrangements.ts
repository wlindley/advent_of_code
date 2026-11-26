import { bigintLog2 } from '../../../shared/core';
import type { AdapterChain } from './chain';

/** Frozen DP record for one node's incoming arrangement count. */
export class ArrangementStep {
  readonly nodeIndex: number;
  readonly predecessorIndices: readonly number[];
  readonly ways: bigint;

  constructor(nodeIndex: number, predecessorIndices: readonly number[], ways: bigint) {
    if (!Number.isInteger(nodeIndex) || nodeIndex < 0) {
      throw new RangeError(`nodeIndex must be a non-negative integer, got ${nodeIndex}`);
    }
    if (ways <= 0n) {
      throw new RangeError(`ways must be positive, got ${ways}`);
    }
    this.nodeIndex = nodeIndex;
    this.predecessorIndices = Object.freeze([...predecessorIndices]);
    this.ways = ways;
    Object.freeze(this);
  }

  get branchCount(): number {
    return this.predecessorIndices.length;
  }

  get isBranching(): boolean {
    return this.predecessorIndices.length > 1;
  }

  get waysLog2(): number {
    return bigintLog2(this.ways);
  }
}

/** Immutable DP table storing arrangement counts across every node in a chain. */
export class ArrangementTable {
  private readonly stepsData: readonly ArrangementStep[];

  constructor(steps: readonly ArrangementStep[]) {
    if (steps.length === 0) {
      throw new RangeError('ArrangementTable requires at least one step');
    }
    this.stepsData = Object.freeze([...steps]);
    Object.freeze(this);
  }

  get nodeCount(): number {
    return this.stepsData.length;
  }

  get steps(): readonly ArrangementStep[] {
    return this.stepsData;
  }

  get totalArrangements(): bigint {
    return this.stepsData[this.stepsData.length - 1]!.ways;
  }

  get maxWaysLog2(): number {
    return bigintLog2(this.totalArrangements);
  }

  stepAt(index: number): ArrangementStep {
    if (!Number.isInteger(index) || index < 0 || index >= this.stepsData.length) {
      throw new RangeError(`Step index ${index} out of bounds [0, ${this.stepsData.length - 1}]`);
    }
    return this.stepsData[index]!;
  }

  waysAt(index: number): bigint {
    return this.stepAt(index).ways;
  }
}

/** Computes exact BigInt arrangement counts via sliding 3-predecessor DP in O(N). */
export function computeArrangementTable(chain: AdapterChain): ArrangementTable {
  const steps: ArrangementStep[] = [new ArrangementStep(0, chain.predecessorIndices(0), 1n)];
  for (let i = 1; i < chain.nodeCount; i += 1) {
    const preds = chain.predecessorIndices(i);
    let ways = 0n;
    for (const p of preds) {
      ways += steps[p]!.ways;
    }
    steps.push(new ArrangementStep(i, preds, ways));
  }
  return new ArrangementTable(steps);
}
