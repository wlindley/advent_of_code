import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { XMasVisualizer } from './viz/XMasVisualizer';

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
    part: 2,
    title: 'Ceres Search: X-MAS Crosses',
    puzzleUrl: 'https://adventofcode.com/2024/day/4#part2',
    summary: 'Count all 3x3 X-shaped crosses formed by two intersecting MAS diagonals centered on A.',
    algorithmSummary:
      'Scan interior WordSearchGrid cells row-major, gate on A centers, validate opposing MAS/SAM diagonal corners, and classify each cross into one of four orientations.',
    complexity: 'O(R * C) time across R x C grid cells, O(K) space for K matched crosses',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '9',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: XMasVisualizer,
};
