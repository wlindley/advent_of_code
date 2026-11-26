import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Part1Visualizer } from './viz/Part1Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2021,
    day: 7,
    part: 1,
    title: 'The Treachery of Whales',
    puzzleUrl: 'https://adventofcode.com/2021/day/7',
    summary: 'Find the horizontal target coordinate minimizing total linear alignment fuel across all crabs.',
    algorithmSummary:
      'Binary-search the convex total linear fuel function over [min, max] using exact BigInt arithmetic to locate the leftmost median optimum.',
    complexity: 'O(N log(max - min)) time, O(N) space',
  },
  exampleInput: '16,1,2,0,4,2,7,1,2,14',
  exampleAnswer: '37',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: Part1Visualizer,
};
