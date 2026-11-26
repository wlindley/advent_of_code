import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Part1Visualizer } from './viz/Part1Visualizer';

const EXAMPLE_INPUT = [
  '2199943210',
  '3987894921',
  '9856789892',
  '8767896789',
  '9899965678',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2021,
    day: 9,
    part: 1,
    title: 'Smoke Basin',
    puzzleUrl: 'https://adventofcode.com/2021/day/9',
    summary:
      'Find every cell in a digit heightmap strictly lower than its 4 orthogonal neighbors and sum their (1 + height) risk levels.',
    algorithmSummary:
      'Parse into a validated Heightmap over Grid2D, identify strict 4-neighbor local minima in row-major order, and sum (height + 1).',
    complexity: 'O(R * C) time, O(R * C) space',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '15',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: Part1Visualizer,
};
