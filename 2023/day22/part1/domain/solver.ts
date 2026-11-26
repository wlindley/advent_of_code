import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  type BrickSnapshot,
  buildSlabTrace,
  parseBrickSnapshot,
  settleBricks,
  type SlabTraceFrame,
  SupportGraph,
} from '../../shared';

/** AoC 2023 Day 22 Part 1 solver: counts bricks that can be safely disintegrated. */
export const solver: PuzzleSolver<BrickSnapshot, number, SlabTraceFrame> = {
  parse(raw: string): BrickSnapshot {
    return parseBrickSnapshot(raw);
  },

  solve(snapshot: BrickSnapshot): number {
    return new SupportGraph(settleBricks(snapshot)).safeCount;
  },

  trace(snapshot: BrickSnapshot, options?: TraceOptions): readonly SlabTraceFrame[] {
    const stack = settleBricks(snapshot);
    return buildSlabTrace(stack, new SupportGraph(stack), options);
  },
};
