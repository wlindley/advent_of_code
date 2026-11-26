import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Visualizer } from './viz/Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2019,
    day: 1,
    part: 1,
    title: 'The Tyranny of the Rocket Equation',
    puzzleUrl: 'https://adventofcode.com/2019/day/1',
    summary: 'Compute floor(mass / 3) - 2 (clamped at 0) for each spacecraft module mass and sum the total fuel.',
    algorithmSummary:
      'Parse non-negative integer module masses and sum clamped floor(mass / 3) - 2 across all modules in one pass.',
    complexity: 'O(N) time, O(N) parsed manifest / O(1) extra space',
  },
  exampleInput: '12\n14\n1969\n100756',
  exampleAnswer: '34241',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer,
};
