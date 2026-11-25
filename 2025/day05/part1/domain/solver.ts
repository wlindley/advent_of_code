import { ClosedInterval, IntervalUnion, type PuzzleSolver, type TraceOptions } from '../../../../shared/core';
import { parseDatabase, type IngredientDatabase } from '../../shared';

export const DEFAULT_MAX_TRACE_STEPS = 200;

/** Snapshot of an interval-union binary-search probe step during trace playback. */
export interface IntervalProbeFrame {
  readonly step: number;
  readonly queryIndex: number | null;
  readonly queryId: bigint | null;
  readonly matchedInterval: ClosedInterval | null;
  readonly freshCount: number;
  readonly mergedIntervals: readonly ClosedInterval[];
}

export const solver: PuzzleSolver<IngredientDatabase, number, IntervalProbeFrame> = {
  parse: parseDatabase,

  solve(db: IngredientDatabase): number {
    const union = new IntervalUnion(db.freshRanges);
    let fresh = 0;
    for (const id of db.availableIds) {
      if (union.contains(id)) fresh += 1;
    }
    return fresh;
  },

  trace(db: IngredientDatabase, options?: TraceOptions): readonly IntervalProbeFrame[] {
    const maxSteps = options?.maxSteps ?? DEFAULT_MAX_TRACE_STEPS;
    if (!Number.isInteger(maxSteps) || maxSteps < 1) {
      throw new RangeError(`maxSteps must be a positive integer, got ${maxSteps}`);
    }

    const q = db.availableIds.length;
    const union = new IntervalUnion(db.freshRanges);
    const mergedIntervals = union.intervals;
    const frames: IntervalProbeFrame[] = [];

    if (maxSteps > 1 || q === 0) {
      frames.push({
        step: 0, queryIndex: null, queryId: null, matchedInterval: null, freshCount: 0, mergedIntervals,
      });
    }

    const stride =
      maxSteps === 1
        ? Number.POSITIVE_INFINITY
        : q + 1 <= maxSteps ? 1 : Math.ceil(q / (maxSteps - 1));

    let freshCount = 0;
    for (let i = 0; i < q; i += 1) {
      const queryId = db.availableIds[i]!;
      const matchedInterval = union.findContaining(queryId) ?? null;
      if (matchedInterval !== null) freshCount += 1;
      const step = i + 1;
      // Always retain the final query frame so the trace reaches the exact final answer.
      if (step % stride === 0 || step === q) {
        frames.push({ step, queryIndex: i, queryId, matchedInterval, freshCount, mergedIntervals });
      }
    }

    return frames;
  },
};
