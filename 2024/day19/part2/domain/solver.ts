import type { PuzzleSolver } from '../../../../shared/core';
import {
  type LinenLayout,
  type LinenTraceFrame,
  buildLinenTrace,
  countTotalArrangements,
  parseLinenLayout,
} from '../../shared';

/** Solves AoC 2024 Day 19 Part 2: sums exact BigInt arrangement counts across all designs. */
export function solvePart2(layout: LinenLayout): bigint {
  return countTotalArrangements(layout);
}

export const solver: PuzzleSolver<LinenLayout, bigint, LinenTraceFrame> = Object.freeze({
  parse: parseLinenLayout,
  solve: solvePart2,
  trace: buildLinenTrace,
});
