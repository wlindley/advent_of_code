import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import { ForestGrid } from '../../shared';
import { countVisibleTrees, traceVisibility, VisibilityTraceFrame } from './visibility';

export interface TreeVisibilitySolver
  extends PuzzleSolver<ForestGrid, number, VisibilityTraceFrame> {
  trace(input: ForestGrid, options?: TraceOptions): readonly VisibilityTraceFrame[];
}

export const solver: TreeVisibilitySolver = Object.freeze({
  parse: ForestGrid.parse,
  solve: countVisibleTrees,
  trace: traceVisibility,
});
