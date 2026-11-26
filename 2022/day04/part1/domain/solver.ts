import {
  sampleTraceIndices,
  validateMaxSteps,
  type ClosedInterval,
  type PuzzleSolver,
  type TraceOptions,
} from '../../../../shared/core';
import {
  AssignmentPair,
  computeGlobalBounds,
  createEmptyRelationCounts,
  DEFAULT_MAX_TRACE_STEPS,
  parseAssignmentPairs,
  RelationTally,
  type PairRelation,
} from '../../shared';

export interface AssignmentTraceFrame {
  readonly stepIndex: number;
  readonly totalSteps: number;
  readonly pairIndex: number;
  readonly totalPairs: number;
  readonly pair: AssignmentPair;
  readonly globalBounds: ClosedInterval;
  readonly tally: RelationTally;
}

function assertNonEmptyPairs(pairs: readonly AssignmentPair[]): void {
  if (pairs.length === 0) {
    throw new RangeError('Assignment pair list must contain at least one pair');
  }
}

function collectAllIntervals(pairs: readonly AssignmentPair[]): ClosedInterval[] {
  const intervals: ClosedInterval[] = [];
  for (const pair of pairs) {
    intervals.push(pair.first, pair.second);
  }
  return intervals;
}

function buildTraceFrame(
  stepIndex: number,
  totalSteps: number,
  pairIndex: number,
  totalPairs: number,
  pair: AssignmentPair,
  globalBounds: ClosedInterval,
  counts: Readonly<Record<PairRelation, number>>,
): AssignmentTraceFrame {
  return Object.freeze({
    stepIndex,
    totalSteps,
    pairIndex,
    totalPairs,
    pair,
    globalBounds,
    tally: new RelationTally(counts),
  });
}

/** Counts how many assignment pairs have one range fully containing the other. */
export function solvePart1(pairs: readonly AssignmentPair[]): number {
  assertNonEmptyPairs(pairs);
  let total = 0;
  for (const pair of pairs) {
    if (pair.hasFullContainment) total += 1;
  }
  return total;
}

/** Simulates all pairs and emits up to `maxSteps` bounded cumulative trace frames. */
export function tracePart1(
  pairs: readonly AssignmentPair[],
  options?: TraceOptions,
): readonly AssignmentTraceFrame[] {
  assertNonEmptyPairs(pairs);
  const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const sampled = sampleTraceIndices(pairs.length, maxSteps);
  const globalBounds = computeGlobalBounds(collectAllIntervals(pairs));
  const counts = createEmptyRelationCounts();
  const frames: AssignmentTraceFrame[] = [];
  let sampleCursor = 0;

  for (let i = 0; i < pairs.length; i += 1) {
    const pair = pairs[i]!;
    counts[pair.relation] += 1;
    if (sampled[sampleCursor] === i) {
      frames.push(
        buildTraceFrame(sampleCursor, sampled.length, i, pairs.length, pair, globalBounds, counts),
      );
      sampleCursor += 1;
    }
  }
  return Object.freeze(frames);
}

export const solver: PuzzleSolver<readonly AssignmentPair[], number, AssignmentTraceFrame> = {
  parse: parseAssignmentPairs,
  solve: solvePart1,
  trace: tracePart1,
};
