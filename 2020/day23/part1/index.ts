import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { CrabCupsPart1Visualizer } from './viz/CrabCupsPart1Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2020,
    day: 23,
    part: 1,
    title: 'Crab Cups',
    puzzleUrl: 'https://adventofcode.com/2020/day/23',
    summary:
      'Simulate 100 clockwise pick-up-and-splice cup moves around a circular ring, then read all cup labels clockwise after cup 1.',
    algorithmSummary:
      'Represent the circular ring as an Int32Array successor table (next[cup]) so picking up 3 cups, wrapping destination selection, and re-splicing run in O(1) time per move.',
    complexity: 'O(M + N) time and O(N) space for M moves and N cups',
  },
  exampleInput: '389125467',
  exampleAnswer: '67384529',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: CrabCupsPart1Visualizer,
};
