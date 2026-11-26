import {
  DIRS_8,
  sampleTraceIndices,
  validateMaxSteps,
  type PuzzleSolver,
  type TraceOptions,
} from '../../../../shared/core';
import { parseWordSearch, type WordSearchGrid } from '../../shared';
import { TARGET_WORD, WordMatch } from './match';

export const DEFAULT_MAX_TRACE_STEPS = 200;

export interface WordSearchTraceFrame {
  readonly foundCount: number;
  readonly totalMatches: number;
  readonly activeMatch: WordMatch | null;
}

function collectMatchesFrom(grid: WordSearchGrid, row: number, col: number, out: WordMatch[]): void {
  for (const [dr, dc] of DIRS_8) {
    if (grid.matchesAt(row, col, dr, dc, TARGET_WORD)) {
      out.push(new WordMatch(row, col, dr, dc, TARGET_WORD.length));
    }
  }
}

function createTraceFrame(
  foundCount: number,
  totalMatches: number,
  activeMatch: WordMatch | null,
): WordSearchTraceFrame {
  return Object.freeze({ foundCount, totalMatches, activeMatch });
}

/** Finds all occurrences of `XMAS` across all 8 directions in row-major order. */
export function findXmasMatches(grid: WordSearchGrid): readonly WordMatch[] {
  const matches: WordMatch[] = [];
  for (let row = 0; row < grid.rows; row += 1) {
    for (let col = 0; col < grid.cols; col += 1) {
      if (grid.at(row, col) === 'X') collectMatchesFrom(grid, row, col, matches);
    }
  }
  return Object.freeze(matches);
}

/** Counts total `XMAS` occurrences in the word-search grid. */
export function countXmas(grid: WordSearchGrid): number {
  return findXmasMatches(grid).length;
}

/** Emits uniformly sampled trace snapshots up to `maxSteps` for visualization playback. */
export function traceXmasMatches(
  grid: WordSearchGrid,
  options?: TraceOptions,
): readonly WordSearchTraceFrame[] {
  const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const matches = findXmasMatches(grid);
  if (matches.length === 0) return Object.freeze([createTraceFrame(0, 0, null)]);
  const indices = sampleTraceIndices(matches.length, maxSteps);
  const frames: WordSearchTraceFrame[] = [];
  for (const index of indices) {
    frames.push(createTraceFrame(index + 1, matches.length, matches[index]!));
  }
  return Object.freeze(frames);
}

export const solver: PuzzleSolver<WordSearchGrid, number, WordSearchTraceFrame> = Object.freeze({
  parse: parseWordSearch,
  solve: countXmas,
  trace: traceXmasMatches,
});
