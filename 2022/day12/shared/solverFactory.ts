import type { PuzzleSolver, TraceOptions } from '../../../shared/core';
import { type HeightMap, parseHeightMap } from './heightMap';
import { computeReverseBfs } from './reverseBfs';
import type { StartCondition } from './startCondition';
import { buildHillClimbTrace, type HillClimbTraceFrame } from './trace';

/** Builds an immutable `PuzzleSolver` parameterized by a `StartCondition` strategy. */
export function createHillClimbingSolver(
  condition: StartCondition,
): PuzzleSolver<HeightMap, number, HillClimbTraceFrame> {
  return Object.freeze({
    parse: parseHeightMap,
    solve: (map: HeightMap) => {
      const field = computeReverseBfs(map);
      const startIndex = field.findNearestStart(map, condition);
      if (startIndex === null) {
        throw new Error(`No reachable start cell matching "${condition.label}"`);
      }
      return field.distanceAt(startIndex)!;
    },
    trace: (map: HeightMap, options?: TraceOptions) =>
      buildHillClimbTrace(map, computeReverseBfs(map), condition, options),
  });
}
