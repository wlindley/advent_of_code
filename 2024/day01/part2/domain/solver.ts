import {
  sampleTraceIndices,
  validateMaxSteps,
  type PuzzleSolver,
  type TraceOptions,
} from '../../../../shared/core';
import { LocationLists, parseLocationLists } from '../../shared';

export const DEFAULT_MAX_TRACE_STEPS = 200;

export interface SimilarityTraceFrame {
  readonly scannedCount: number;
  readonly totalItems: number;
  readonly activeMatch: LocationMatch | null;
  readonly cumulativeScore: bigint;
}

function assertSafeInt(value: number, label: string): number {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`${label} must be a safe integer, got ${value}`);
  }
  return value + 0;
}

function assertNonNegativeSafeInt(value: number, label: string): number {
  const safe = assertSafeInt(value, label);
  if (safe < 0) {
    throw new RangeError(`${label} must be non-negative, got ${value}`);
  }
  return safe;
}

function createTraceFrame(
  scannedCount: number,
  totalItems: number,
  activeMatch: LocationMatch | null,
  cumulativeScore: bigint,
): SimilarityTraceFrame {
  return Object.freeze({
    scannedCount,
    totalItems,
    activeMatch,
    cumulativeScore,
  });
}

/** Immutable left-column location match with its right-column frequency. */
export class LocationMatch {
  readonly index: number;
  readonly locationId: number;
  readonly rightCount: number;

  constructor(index: number, locationId: number, rightCount: number) {
    this.index = assertNonNegativeSafeInt(index, 'index');
    this.locationId = assertSafeInt(locationId, 'locationId');
    this.rightCount = assertNonNegativeSafeInt(rightCount, 'rightCount');
    Object.freeze(this);
  }

  get contribution(): bigint {
    return BigInt(this.locationId) * BigInt(this.rightCount);
  }
}

/** Counts occurrences of each location ID in the right column. */
export function buildRightFrequencies(lists: LocationLists): ReadonlyMap<number, number> {
  const counts = new Map<number, number>();
  for (let i = 0; i < lists.size; i += 1) {
    const id = lists.right[i]!;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

/** Computes the BigInt similarity score by summing `leftId * rightFreq(leftId)`. */
export function computeSimilarityScore(lists: LocationLists): bigint {
  const rightCounts = buildRightFrequencies(lists);
  let total = 0n;
  for (let i = 0; i < lists.size; i += 1) {
    const id = lists.left[i]!;
    const count = rightCounts.get(id) ?? 0;
    total += BigInt(id) * BigInt(count);
  }
  return total;
}

/** Traces cumulative similarity score sampled uniformly up to `maxSteps`. */
export function traceSimilarityScore(
  lists: LocationLists,
  options?: TraceOptions,
): readonly SimilarityTraceFrame[] {
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const sampled = sampleTraceIndices(lists.size + 1, limit);
  const rightCounts = buildRightFrequencies(lists);
  const frames: SimilarityTraceFrame[] = [];
  let cursor = 0;
  let cumulativeScore = 0n;

  for (let scannedCount = 0; scannedCount <= lists.size; scannedCount += 1) {
    const index = scannedCount - 1;
    let locationId = 0;
    let rightCount = 0;
    if (index >= 0) {
      locationId = lists.left[index]!;
      rightCount = rightCounts.get(locationId) ?? 0;
      cumulativeScore += BigInt(locationId) * BigInt(rightCount);
    }
    if (sampled[cursor] === scannedCount) {
      const activeMatch = index >= 0 ? new LocationMatch(index, locationId, rightCount) : null;
      frames.push(createTraceFrame(scannedCount, lists.size, activeMatch, cumulativeScore));
      cursor += 1;
    }
  }
  return Object.freeze(frames);
}

export const solver: PuzzleSolver<LocationLists, bigint, SimilarityTraceFrame> = Object.freeze({
  parse: parseLocationLists,
  solve: computeSimilarityScore,
  trace: traceSimilarityScore,
});
