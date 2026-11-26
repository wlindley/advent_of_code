import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import { parsePipeMaze, traceMainLoop, type PipeMaze } from '../../shared';
import { analyzeEnclosedTiles } from './enclosed';
import { buildEnclosedScanTrace, type EnclosedScanFrame } from './trace';

/** Computes the number of non-loop tiles enclosed inside the main loop. */
export function solvePipeMazePart2(maze: PipeMaze): number {
  const loop = traceMainLoop(maze);
  return analyzeEnclosedTiles(maze, loop).count;
}

/** Builds bounded row-by-row parity scan trace frames for a pipe maze. */
export function tracePipeMazePart2(
  maze: PipeMaze,
  options?: TraceOptions,
): readonly EnclosedScanFrame[] {
  const loop = traceMainLoop(maze);
  const analysis = analyzeEnclosedTiles(maze, loop);
  return buildEnclosedScanTrace(analysis, options);
}

export const solver: PuzzleSolver<PipeMaze, number, EnclosedScanFrame> = Object.freeze({
  parse: parsePipeMaze,
  solve: solvePipeMazePart2,
  trace: tracePipeMazePart2,
});
