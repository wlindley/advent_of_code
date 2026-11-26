import type { PuzzleSolver, TraceOptions } from '../../../shared/core';
import { analyzeReindeerMaze, type MazeAnalysis } from './dijkstra';
import { parseReindeerMaze } from './parse';
import { buildMazeTrace, type MazeTraceFrame } from './trace';
import type { ReindeerMaze } from './types';

export interface MazeObjective {
  extractAnswer(analysis: MazeAnalysis): number;
}

/** Creates a `PuzzleSolver` parameterized by a Part 1 / Part 2 `MazeObjective`. */
export function createReindeerMazeSolver(
  objective: MazeObjective,
): PuzzleSolver<ReindeerMaze, number, MazeTraceFrame> {
  return {
    parse(raw: string): ReindeerMaze {
      return parseReindeerMaze(raw);
    },
    solve(maze: ReindeerMaze): number {
      return objective.extractAnswer(analyzeReindeerMaze(maze));
    },
    trace(maze: ReindeerMaze, options?: TraceOptions): readonly MazeTraceFrame[] {
      return buildMazeTrace(analyzeReindeerMaze(maze), options);
    },
  };
}
