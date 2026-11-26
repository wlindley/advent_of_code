import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import { ForestGrid } from '../../shared';
import { findMaxScenicScore, ScenicTraceFrame, traceScenicScore } from './scenic';

export interface ScenicScoreSolver extends PuzzleSolver<ForestGrid, number, ScenicTraceFrame> {
  trace(input: ForestGrid, options?: TraceOptions): readonly ScenicTraceFrame[];
}

export const solver: ScenicScoreSolver = Object.freeze({
  parse: ForestGrid.parse,
  solve: findMaxScenicScore,
  trace: traceScenicScore,
});
