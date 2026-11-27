import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Part2Visualizer } from './viz/Part2Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2021,
    day: 17,
    part: 2,
    title: 'Trick Shot',
    puzzleUrl: 'https://adventofcode.com/2021/day/17#part2',
    summary:
      'Count every distinct integer probe launch velocity (vx, vy) whose discrete trajectory lands inside the target trench area.',
    algorithmSummary:
      'Compute active step intervals for feasible vx and vy independently, build Int32Array prefix sums over x-interval endpoints, and sum matching x-window counts across every vy interval in O(1) per vy.',
    complexity: 'O((X + |Y|) * |Y|) time and O(|Y|) space for target bounds X = xMax and Y = yMin',
  },
  exampleInput: 'target area: x=20..30, y=-10..-5',
  exampleAnswer: '112',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: Part2Visualizer,
};
