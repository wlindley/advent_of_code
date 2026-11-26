import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Part2Visualizer } from './viz/Part2Visualizer';

const EXAMPLE_INPUT = [
  '2199943210',
  '3987894921',
  '9856789892',
  '8767896789',
  '9899965678',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2021,
    day: 9,
    part: 2,
    title: 'Smoke Basin',
    puzzleUrl: 'https://adventofcode.com/2021/day/9#part2',
    summary:
      'Flood every non-ridge basin bounded by height-9 ridges in a digit heightmap and multiply the sizes of the three largest basins.',
    algorithmSummary:
      'Analyze 4-connected non-ridge basins via BFS waves from strict low points, rank basin sizes descending, and multiply the top three.',
    complexity: 'O(R * C + B log B) time, O(R * C) space',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '1134',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: Part2Visualizer,
};
