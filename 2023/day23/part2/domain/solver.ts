import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  buildHikeTrace,
  contractTrailGraph,
  findLongestPath,
  type HikeTraceFrame,
  parseTrailMap,
  type TrailMap,
} from '../../shared';

/** AoC 2023 Day 23 Part 2 solver: longest slope-ignoring simple hike from start to exit. */
export const solver: PuzzleSolver<TrailMap, number, HikeTraceFrame> = {
  parse(raw: string): TrailMap {
    return parseTrailMap(raw);
  },

  solve(map: TrailMap): number {
    const result = findLongestPath(contractTrailGraph(map, true));
    if (result === null) {
      throw new Error('No valid trail path from start to exit');
    }
    return result.distance;
  },

  trace(map: TrailMap, options?: TraceOptions): readonly HikeTraceFrame[] {
    const graph = contractTrailGraph(map, true);
    return buildHikeTrace(map, graph, findLongestPath(graph), options);
  },
};
