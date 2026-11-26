import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { PyroclasticPart2Visualizer } from './viz/PyroclasticPart2Visualizer';

const EXAMPLE_INPUT = '>>><<><>><<<>><>>><<<>>><<<><<<>><>><<>>';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2022,
    day: 17,
    part: 2,
    title: 'Pyroclastic Flow',
    puzzleUrl: 'https://adventofcode.com/2022/day/17#part2',
    summary: 'Compute the final tower height after 1,000,000,000,000 falling rocks via cycle detection.',
    algorithmSummary:
      'Simulate 7-bit row masks until (nextRockIndex, nextJetIndex, reachableProfile) repeats, then fast-forward full cycles in BigInt.',
    complexity: 'O(cycleStart + cycleLen) simulation + O(1) BigInt cycle skip',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '1514285714288',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: PyroclasticPart2Visualizer,
};
