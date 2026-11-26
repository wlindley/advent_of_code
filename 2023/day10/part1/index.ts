import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { PipeMazePart1Visualizer } from './viz/PipeMazePart1Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2023,
    day: 10,
    part: 1,
    title: 'Pipe Maze',
    puzzleUrl: 'https://adventofcode.com/2023/day/10',
    summary:
      'Infer the start pipe shape from reciprocal neighbor ports, trace the unique closed cycle containing S, and compute the maximum loop distance from S.',
    algorithmSummary:
      'Bitmask port inference for S followed by an O(L) single-pass traversal of the degree-2 cycle; farthest distance is L / 2.',
    complexity: 'O(R * C) parsing and O(L) loop traversal time and space',
  },
  exampleInput: ['7-F7-', '.FJ|7', 'SJLL7', '|F--J', 'LJ.LJ'].join('\n'),
  exampleAnswer: '8',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: PipeMazePart1Visualizer,
};
