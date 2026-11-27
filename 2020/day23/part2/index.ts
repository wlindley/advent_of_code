import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { CrabCupsPart2Visualizer } from './viz/CrabCupsPart2Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2020,
    day: 23,
    part: 2,
    title: 'Crab Cups',
    puzzleUrl: 'https://adventofcode.com/2020/day/23#part2',
    summary:
      'Extend the cup ring sequentially to 1,000,000 cups, run 10,000,000 pick-up-and-splice moves, and multiply the two labels immediately clockwise of cup 1.',
    algorithmSummary:
      'Store the million-cup circle in an Int32Array successor table (next[cup]) for O(1) pick-up, destination wrap, and re-splice per move, computing the final product as BigInt.',
    complexity: 'O(M + N) time and O(N) space for M = 10,000,000 moves and N = 1,000,000 cups',
  },
  exampleInput: '389125467',
  exampleAnswer: '149245887792',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: CrabCupsPart2Visualizer,
};
