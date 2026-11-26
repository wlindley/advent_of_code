import {
  sampleTraceIndices,
  validateMaxSteps,
  type PuzzleSolver,
  type TraceOptions,
} from '../../../../shared/core';
import {
  comparePackets,
  ComparisonTrace,
  PacketPair,
  parseSignalInput,
  SignalInput,
  traceComparison,
  type PacketOrder,
} from '../../shared';

export const DEFAULT_MAX_TRACE_STEPS = 150;

/** Immutable trace snapshot at a single 1-based packet pair index. */
export class PairTraceFrame {
  readonly pairIndex: number;
  readonly totalPairs: number;
  readonly pair: PacketPair;
  readonly comparison: ComparisonTrace;
  readonly outcomes: readonly PacketOrder[];

  constructor(
    pairIndex: number,
    totalPairs: number,
    pair: PacketPair,
    comparison: ComparisonTrace,
    outcomes: readonly PacketOrder[],
  ) {
    if (!Number.isInteger(totalPairs) || totalPairs < 1) {
      throw new RangeError(`totalPairs must be a positive integer, got ${totalPairs}`);
    }
    if (!Number.isInteger(pairIndex) || pairIndex < 1 || pairIndex > totalPairs) {
      throw new RangeError(`pairIndex must be in [1, ${totalPairs}], got ${pairIndex}`);
    }
    if (outcomes.length !== pairIndex) {
      throw new RangeError(`outcomes length must equal pairIndex ${pairIndex}, got ${outcomes.length}`);
    }
    if (outcomes[pairIndex - 1] !== comparison.outcome) {
      throw new Error('outcomes tail must match comparison outcome');
    }
    this.pairIndex = pairIndex;
    this.totalPairs = totalPairs;
    this.pair = pair;
    this.comparison = comparison;
    this.outcomes = Object.freeze([...outcomes]);
    Object.freeze(this);
  }

  get order(): PacketOrder {
    return this.comparison.outcome;
  }

  get isRightOrder(): boolean {
    return this.comparison.outcome < 0;
  }

  get rightOrderCount(): number {
    let count = 0;
    for (const outcome of this.outcomes) {
      if (outcome < 0) count += 1;
    }
    return count;
  }

  get rightOrderIndexSum(): number {
    let sum = 0;
    for (let i = 0; i < this.outcomes.length; i += 1) {
      if (this.outcomes[i]! < 0) sum += i + 1;
    }
    return sum;
  }

  get isComplete(): boolean {
    return this.pairIndex === this.totalPairs;
  }
}

/** Sums 1-based indices of packet pairs that are strictly in the right order. */
export function solvePart1(input: SignalInput): number {
  let sum = 0;
  for (let i = 0; i < input.pairCount; i += 1) {
    const pair = input.pairs[i]!;
    if (comparePackets(pair.left, pair.right) < 0) {
      sum += i + 1;
    }
  }
  return sum;
}

/** Builds a bounded sequence of pair comparison snapshots for visualization. */
export function buildPart1Trace(
  input: SignalInput,
  options?: TraceOptions,
): readonly PairTraceFrame[] {
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const sampled = sampleTraceIndices(input.pairCount, limit);
  const allOutcomes = input.pairs.map((pair) => comparePackets(pair.left, pair.right));
  return Object.freeze(
    sampled.map((idx) => {
      const pair = input.pairs[idx]!;
      return new PairTraceFrame(
        idx + 1,
        input.pairCount,
        pair,
        traceComparison(pair.left, pair.right),
        allOutcomes.slice(0, idx + 1),
      );
    }),
  );
}

export const solver: PuzzleSolver<SignalInput, number, PairTraceFrame> = Object.freeze({
  parse: parseSignalInput,
  solve: solvePart1,
  trace: buildPart1Trace,
});
