import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  buildMinCutTrace,
  findThreeEdgeCut,
  type MinCutTraceFrame,
  parseWiringGraph,
  type WiringGraph,
} from '../../shared';

/** AoC 2023 Day 25 Part 1 solver: finds the 3-edge cut and multiplies both cluster sizes. */
export const solver: Required<PuzzleSolver<WiringGraph, number, MinCutTraceFrame>> = {
  parse(raw: string): WiringGraph {
    return parseWiringGraph(raw);
  },

  solve(graph: WiringGraph): number {
    return findThreeEdgeCut(graph).product;
  },

  trace(graph: WiringGraph, options?: TraceOptions): readonly MinCutTraceFrame[] {
    return buildMinCutTrace(graph, options);
  },
};
