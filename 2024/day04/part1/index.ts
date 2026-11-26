import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { WordSearchVisualizer } from './viz/WordSearchVisualizer';

const EXAMPLE_INPUT = [
  'MMMSXXMASM',
  'MSAMXMSMSA',
  'AMXSXMAAMM',
  'MSAMASMSMX',
  'XMASAMXAMM',
  'XXAMMXXAMA',
  'SMSMSASXSS',
  'SAXAMASAAA',
  'MAMMMXMMMM',
  'MXMXAXMASX',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2024,
    day: 4,
    part: 1,
    title: 'Ceres Search',
    puzzleUrl: 'https://adventofcode.com/2024/day/4',
    summary: 'Count all occurrences of XMAS across horizontal, vertical, and diagonal directions in a letter grid.',
    algorithmSummary:
      'Scan the validated WordSearchGrid row-major, gate on X cells, verify O(1) endpoint bounds, and match XMAS along all 8 unit directions.',
    complexity: 'O(R * C) time across R x C grid cells, O(M) space for M matched rays',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '18',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: WordSearchVisualizer,
};
