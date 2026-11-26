import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Part2Visualizer } from './viz/Part2Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2021,
    day: 7,
    part: 2,
    title: 'The Treachery of Whales',
    puzzleUrl: 'https://adventofcode.com/2021/day/7#part2',
    summary: 'Find the horizontal target coordinate minimizing total triangular alignment fuel across all crabs.',
    algorithmSummary:
      'Binary-search the convex total triangular fuel function over [min, max] using exact BigInt arithmetic to locate the leftmost mean-adjacent optimum.',
    complexity: 'O(N log(max - min)) time, O(N) space',
  },
  exampleInput: '16,1,2,0,4,2,7,1,2,14',
  exampleAnswer: '168',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: Part2Visualizer,
};
