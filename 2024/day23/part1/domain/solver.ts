import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  type LanGraph,
  type LanPartySnapshot,
  buildTriangleTrace,
  findTriangles,
  parseLanGraph,
} from '../../shared';

export const PART1_PREFIX = 't';

/** Counts connected computer triangles containing at least one `'t*'` computer. */
export function solvePart1(graph: LanGraph): number {
  return findTriangles(graph, PART1_PREFIX).length;
}

export const solver: PuzzleSolver<LanGraph, number, LanPartySnapshot> = Object.freeze({
  parse: (raw: string) => parseLanGraph(raw),
  solve: (graph: LanGraph) => solvePart1(graph),
  trace: (graph: LanGraph, options?: TraceOptions) =>
    buildTriangleTrace(graph, PART1_PREFIX, options),
});
