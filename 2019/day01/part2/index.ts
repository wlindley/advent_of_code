import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Visualizer } from './viz/Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2019,
    day: 1,
    part: 2,
    title: 'The Tyranny of the Rocket Equation',
    puzzleUrl: 'https://adventofcode.com/2019/day/1#part2',
    summary: 'Recursively compute floor(mass / 3) - 2 per module until positive fuel reaches zero, then sum.',
    algorithmSummary:
      'Parse non-negative integer module masses and iteratively add positive floor(fuel / 3) - 2 stages per module.',
    complexity: 'O(N log M) time, O(N) parsed manifest / O(log M) extra space',
  },
  exampleInput: '12\n14\n1969\n100756',
  exampleAnswer: '51316',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer,
};
