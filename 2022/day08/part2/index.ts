import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { ScenicScoreVisualizer } from './viz/ScenicScoreVisualizer';

const EXAMPLE_INPUT = ['30373', '25512', '65332', '33549', '35390'].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2022,
    day: 8,
    part: 2,
    title: 'Treetop Tree House',
    puzzleUrl: 'https://adventofcode.com/2022/day/8#part2',
    summary:
      'Find the highest scenic score among all trees, defined as the product of viewing distances in all four cardinal directions.',
    algorithmSummary:
      'Reuse the O(R * C) 4-pass monotonic-stack viewing distances from ForestSightlines and scan interior trees in row-major order to find the maximum scenic score.',
    complexity: 'O(R * C) time, O(R * C) space',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '8',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: ScenicScoreVisualizer,
};
