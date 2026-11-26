import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { TreeVisibilityVisualizer } from './viz/TreeVisibilityVisualizer';

const EXAMPLE_INPUT = ['30373', '25512', '65332', '33549', '35390'].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2022,
    day: 8,
    part: 1,
    title: 'Treetop Tree House',
    puzzleUrl: 'https://adventofcode.com/2022/day/8',
    summary:
      'Count how many trees in a rectangular height grid are visible from outside the grid along at least one cardinal line of sight.',
    algorithmSummary:
      'Run four cardinal monotonic-stack sweeps (UP, RIGHT, DOWN, LEFT) in O(R * C) time to record each tree’s unobstructed visibility bitmask and viewing distances.',
    complexity: 'O(R * C) time, O(R * C) space',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '21',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: TreeVisibilityVisualizer,
};
