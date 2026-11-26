import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  type LinenLayout,
  type LinenTraceFrame,
  buildLinenTrace,
  countPossibleDesigns,
  parseLinenLayout,
} from '../../shared';

/** Solves AoC 2024 Day 19 Part 1: counts target designs formable from available towel patterns. */
export function solvePart1(layout: LinenLayout): number {
  return countPossibleDesigns(layout);
}

export const solver: PuzzleSolver<LinenLayout, number, LinenTraceFrame> = Object.freeze({
  parse: (raw: string) => parseLinenLayout(raw),
  solve: (layout: LinenLayout) => solvePart1(layout),
  trace: (layout: LinenLayout, options?: TraceOptions) => buildLinenTrace(layout, options),
});
