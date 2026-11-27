import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Visualizer } from './viz/Visualizer';

const BREAKOUT_ROM = [
  1, 0, 0, 231,
  104, 0, 104, 0, 104, 1, 104, 1, 104, 0, 104, 1, 104, 2, 104, 0, 104, 1, 104, 3, 104, 0, 104, 1, 104, 4, 104, 0, 104, 1,
  104, 0, 104, 1, 104, 1, 104, 4, 104, 1, 104, 1, 104, 0, 104, 2, 104, 1, 104, 4, 104, 2, 104, 1,
  104, 0, 104, 3, 104, 1, 104, 4, 104, 3, 104, 1, 104, 0, 104, 4, 104, 1, 104, 4, 104, 4, 104, 1,
  104, 1, 104, 1, 104, 2, 104, 3, 104, 1, 104, 2, 104, 1, 104, 4, 104, 3, 104, 3, 104, 2, 104, 4,
  1008, 231, 4, 232, 1006, 232, 230,
  3, 233, 1, 234, 233, 234, 1008, 234, 2, 232, 1006, 232, 230,
  104, 1, 104, 4, 104, 0, 4, 234, 104, 4, 104, 3, 104, 3, 104, 1, 104, 0, 104, 3, 104, 2, 104, 0, 104, 2, 104, 3, 104, 4, 104, -1, 104, 0, 104, 45,
  3, 233, 1, 234, 233, 234, 1008, 234, 2, 232, 1006, 232, 230,
  104, 2, 104, 3, 104, 0, 104, 1, 104, 2, 104, 4,
  3, 233, 1, 234, 233, 234, 1008, 234, 1, 232, 1006, 232, 230,
  104, 2, 104, 4, 104, 0, 4, 234, 104, 4, 104, 3, 104, 1, 104, 2, 104, 0, 104, 1, 104, 1, 104, 4, 104, -1, 104, 0, 104, 12345,
  99, 0, 0, 0, 1,
].join(',');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2019,
    day: 13,
    part: 2,
    title: 'Care Package',
    puzzleUrl: 'https://adventofcode.com/2019/day/13#part2',
    summary:
      'Insert two quarters at memory address 0, steer the horizontal paddle underneath the ball across arcade turns, and report the final segment-display score.',
    algorithmSummary:
      'Patch mem[0] = 2, run the Intcode VM while tracking ball and paddle x-coordinates, feed sign(ballX - paddleX) on each input request, and record (-1, 0, score) updates.',
    complexity: 'O(V + D) time and O(T) memory for V VM steps, D output triples, and T distinct screen coordinates',
  },
  exampleInput: BREAKOUT_ROM,
  exampleAnswer: '12345',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer,
};
