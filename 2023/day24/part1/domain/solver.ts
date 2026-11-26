import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  buildHailTrace2D,
  countFutureIntersections2D,
  type Hailstone,
  type HailTrace2DFrame,
  parseHailstones,
  TestArea,
} from '../../shared';

export const PERSONAL_TEST_AREA = new TestArea(200_000_000_000_000n, 400_000_000_000_000n);

/** AoC 2023 Day 24 Part 1 solver: counts future 2D XY intersections within [2e14, 4e14]. */
export const solver: Required<PuzzleSolver<readonly Hailstone[], number, HailTrace2DFrame>> = {
  parse(raw: string): readonly Hailstone[] {
    return parseHailstones(raw);
  },

  solve(hailstones: readonly Hailstone[]): number {
    return countFutureIntersections2D(hailstones, PERSONAL_TEST_AREA);
  },

  trace(hailstones: readonly Hailstone[], options?: TraceOptions): readonly HailTrace2DFrame[] {
    return buildHailTrace2D(hailstones, PERSONAL_TEST_AREA, options);
  },
};
