import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  buildLoopWalkTrace,
  parsePipeMaze,
  traceMainLoop,
  type PipeMaze,
  type PipeMazeTraceFrame,
} from '../../shared';

/** Computes the farthest distance along the main loop from `S`. */
export function solvePipeMazePart1(maze: PipeMaze): number {
  return traceMainLoop(maze).farthestDistance;
}

/** Builds bounded dual-wavefront trace frames along the main loop. */
export function tracePipeMazePart1(
  maze: PipeMaze,
  options?: TraceOptions,
): readonly PipeMazeTraceFrame[] {
  return buildLoopWalkTrace(traceMainLoop(maze), options);
}

export const solver: PuzzleSolver<PipeMaze, number, PipeMazeTraceFrame> = Object.freeze({
  parse: parsePipeMaze,
  solve: solvePipeMazePart1,
  trace: tracePipeMazePart1,
});
