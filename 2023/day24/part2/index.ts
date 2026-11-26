import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { RockPart2Visualizer } from './viz/RockPart2Visualizer';

const EXAMPLE_INPUT = [
  '19, 13, 30 @ -2,  1, -2',
  '18, 19, 22 @ -1, -1, -2',
  '20, 25, 34 @ -2, -2, -4',
  '12, 31, 28 @ -1, -2, -1',
  '20, 19, 15 @  1, -5, -3',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2023,
    day: 24,
    part: 2,
    title: 'Never Tell Me The Odds',
    puzzleUrl: 'https://adventofcode.com/2023/day/24#part2',
    summary:
      'Find the exact initial 3D integer position and velocity of a rock thrown to collide with every hailstone, and sum its initial coordinates.',
    algorithmSummary:
      'Eliminates the quadratic rock-position cross-product by subtracting an anchor hailstone equation, solves the resulting 6x6 exact BigInt Rational linear system via Gaussian elimination, and verifies non-negative integer collision times.',
    complexity: 'O(N) time and O(N) space for N hailstones (6x6 elimination plus N collision checks)',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '47',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: RockPart2Visualizer,
};
