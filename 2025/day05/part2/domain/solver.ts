import { ClosedInterval, IntervalUnion, type PuzzleSolver, type TraceOptions } from '../../../../shared/core';
import { parseDatabase, type IngredientDatabase } from '../../shared';

export const DEFAULT_MAX_TRACE_STEPS = 200;

export type CoalesceAction = 'new' | 'extend' | 'touch' | 'absorbed';

/** Snapshot of a sorted interval-coalescing step during trace playback. */
export interface IntervalCoalesceFrame {
  readonly step: number;
  readonly action: CoalesceAction | null;
  readonly activeInterval: ClosedInterval | null;
  readonly mergedIntervals: readonly ClosedInterval[];
  readonly rawSum: bigint;
  readonly unionTotal: bigint;
}

function compareIntervals(a: ClosedInterval, b: ClosedInterval): number {
  if (a.start !== b.start) return a.start < b.start ? -1 : 1;
  return a.end < b.end ? -1 : a.end > b.end ? 1 : 0;
}

export const solver: PuzzleSolver<IngredientDatabase, bigint, IntervalCoalesceFrame> = {
  parse: parseDatabase,

  solve: (db) => new IntervalUnion(db.freshRanges).totalLength,

  trace(db: IngredientDatabase, options?: TraceOptions): readonly IntervalCoalesceFrame[] {
    const maxSteps = options?.maxSteps ?? DEFAULT_MAX_TRACE_STEPS;
    if (!Number.isInteger(maxSteps) || maxSteps < 1) {
      throw new RangeError(`maxSteps must be a positive integer, got ${maxSteps}`);
    }

    const sorted = Array.from(db.freshRanges).sort(compareIntervals);
    const r = sorted.length;
    const frames: IntervalCoalesceFrame[] = [];
    if (maxSteps > 1 || r === 0) {
      frames.push({
        step: 0, action: null, activeInterval: null,
        mergedIntervals: Object.freeze([]), rawSum: 0n, unionTotal: 0n,
      });
    }

    const stride =
      maxSteps === 1 ? Number.POSITIVE_INFINITY : r + 1 <= maxSteps ? 1 : Math.ceil(r / (maxSteps - 1));
    const merged: ClosedInterval[] = [];
    let rawSum = 0n;
    let unionTotal = 0n;

    for (let i = 0; i < r; i += 1) {
      const next = sorted[i]!;
      rawSum += next.length;
      const prev = merged.at(-1);
      let action: CoalesceAction;
      if (!prev || next.start > prev.end + 1n) {
        action = 'new';
        merged.push(next);
        unionTotal += next.length;
      } else if (next.start === prev.end + 1n) {
        action = 'touch';
        merged[merged.length - 1] = new ClosedInterval(prev.start, next.end);
        unionTotal += next.length;
      } else if (next.end <= prev.end) {
        action = 'absorbed';
      } else {
        action = 'extend';
        merged[merged.length - 1] = new ClosedInterval(prev.start, next.end);
        unionTotal += next.end - prev.end;
      }

      const step = i + 1;
      // Always retain the final step so playback reaches the exact union total.
      if (step % stride === 0 || step === r) {
        frames.push({
          step, action, activeInterval: next,
          mergedIntervals: Object.freeze([...merged]), rawSum, unionTotal,
        });
      }
    }
    return frames;
  },
};
