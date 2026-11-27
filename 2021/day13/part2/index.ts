import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Part2Visualizer } from './viz/Part2Visualizer';

const EXAMPLE_INPUT = [
  '0,0', '0,12', '3,0', '16,1', '3,11', '0,2', '15,10', '2,10', '13,2',
  '0,9', '13,9', '0,4', '3,8', '16,7', '3,5', '11,0', '6,0', '10,0',
  '9,12', '6,11', '10,2', '6,3', '10,8', '5,7', '10,7', '7,5',
  '',
  'fold along y=6',
  'fold along x=8',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2021,
    day: 13,
    part: 2,
    title: 'Transparent Origami',
    puzzleUrl: 'https://adventofcode.com/2021/day/13#part2',
    summary:
      'Apply every horizontal and vertical fold instruction to transparent paper and decode the resulting 5x6 bitmap activation code.',
    algorithmSummary:
      'Sequentially fold an immutable DotSheet across all orthogonal creases, then match each 5x6 bitmap slot against packed 30-bit canonical AoC font masks.',
    complexity: 'O(F * N log N) time, O(N) space for N initial dots and F folds',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: 'HI',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: Part2Visualizer,
};
