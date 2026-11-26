import {
  sampleTraceIndices,
  validateMaxSteps,
  type PuzzleSolver,
  type TraceOptions,
} from '../../../../shared/core';
import { LocationLists, parseLocationLists } from '../../shared';

export const DEFAULT_MAX_TRACE_STEPS = 200;

export interface SortedLocationColumns {
  readonly left: readonly number[];
  readonly right: readonly number[];
}

export interface DistanceTraceFrame {
  readonly pairedCount: number;
  readonly totalPairs: number;
  readonly activePair: RankedPair | null;
  readonly cumulativeDistance: number;
}

function assertSafeInt(value: number, label: string): number {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`${label} must be a safe integer, got ${value}`);
  }
  return value + 0;
}

/** Immutable rank-matched pair of sorted location IDs. */
export class RankedPair {
  readonly rank: number;
  readonly left: number;
  readonly right: number;

  constructor(rank: number, left: number, right: number) {
    const safeRank = assertSafeInt(rank, 'rank');
    if (safeRank < 0) {
      throw new RangeError(`rank must be non-negative, got ${rank}`);
    }
    this.rank = safeRank;
    this.left = assertSafeInt(left, 'left');
    this.right = assertSafeInt(right, 'right');
    Object.freeze(this);
  }

  get distance(): number {
    return Math.abs(this.left - this.right);
  }
}

function sortNumericColumn(values: readonly number[]): Float64Array {
  // Typed-array .sort() is numeric by default (unlike Array.prototype.sort()).
  return Float64Array.from(values).sort();
}

function addSafeDistance(total: number, left: number, right: number): number {
  const next = total + Math.abs(left - right);
  if (!Number.isSafeInteger(next)) {
    throw new RangeError(`Total distance exceeds safe integer range at ${next}`);
  }
  return next;
}

function createTraceFrame(
  pairedCount: number,
  totalPairs: number,
  activePair: RankedPair | null,
  cumulativeDistance: number,
): DistanceTraceFrame {
  return Object.freeze({
    pairedCount,
    totalPairs,
    activePair,
    cumulativeDistance,
  });
}

/** Returns frozen ascending numeric copies of both location columns. */
export function sortLocationColumns(lists: LocationLists): SortedLocationColumns {
  return Object.freeze({
    left: Object.freeze(Array.from(sortNumericColumn(lists.left))),
    right: Object.freeze(Array.from(sortNumericColumn(lists.right))),
  });
}

/** Computes the sum of absolute pairwise differences after sorting both columns. */
export function computeTotalDistance(lists: LocationLists): number {
  const sortedLeft = sortNumericColumn(lists.left);
  const sortedRight = sortNumericColumn(lists.right);
  let total = 0;
  for (let i = 0; i < sortedLeft.length; i += 1) {
    total = addSafeDistance(total, sortedLeft[i]!, sortedRight[i]!);
  }
  return total;
}

/** Traces cumulative pairwise distances sampled uniformly up to `maxSteps`. */
export function traceTotalDistance(
  lists: LocationLists,
  options?: TraceOptions,
): readonly DistanceTraceFrame[] {
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const sampledCounts = sampleTraceIndices(lists.size + 1, limit);
  const sortedLeft = sortNumericColumn(lists.left);
  const sortedRight = sortNumericColumn(lists.right);
  const frames: DistanceTraceFrame[] = [];
  let sampleCursor = 0;
  let cumulativeDistance = 0;

  for (let pairedCount = 0; pairedCount <= lists.size; pairedCount += 1) {
    let rank = -1;
    let left = 0;
    let right = 0;
    if (pairedCount > 0) {
      rank = pairedCount - 1;
      left = sortedLeft[rank]!;
      right = sortedRight[rank]!;
      cumulativeDistance = addSafeDistance(cumulativeDistance, left, right);
    }
    if (sampledCounts[sampleCursor] === pairedCount) {
      const activePair = rank >= 0 ? new RankedPair(rank, left, right) : null;
      frames.push(createTraceFrame(pairedCount, lists.size, activePair, cumulativeDistance));
      sampleCursor += 1;
    }
  }
  return Object.freeze(frames);
}

export const solver: PuzzleSolver<LocationLists, number, DistanceTraceFrame> = Object.freeze({
  parse: parseLocationLists,
  solve: computeTotalDistance,
  trace: traceTotalDistance,
});
