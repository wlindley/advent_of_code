import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { ClawContraptionPart2Visualizer } from './viz/ClawContraptionPart2Visualizer';

const EXAMPLE_INPUT = [
  'Button A: X+94, Y+34',
  'Button B: X+22, Y+67',
  'Prize: X=8400, Y=5400',
  '',
  'Button A: X+26, Y+66',
  'Button B: X+67, Y+21',
  'Prize: X=12748, Y=12176',
  '',
  'Button A: X+17, Y+86',
  'Button B: X+84, Y+37',
  'Prize: X=7870, Y=6450',
  '',
  'Button A: X+69, Y+23',
  'Button B: X+27, Y+71',
  'Prize: X=18641, Y=10279',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2024,
    day: 13,
    part: 2,
    title: 'Claw Contraption',
    puzzleUrl: 'https://adventofcode.com/2024/day/13#part2',
    summary:
      'Find the minimum token cost (3 per A press, 1 per B press) to reach each winnable prize shifted by +10^13 on both axes with unbounded presses.',
    algorithmSummary:
      'Solve each 2x2 BigInt system via Cramer’s rule when non-singular, or extended GCD with cost-slope endpoint minimization when collinear.',
    complexity: 'O(N log(maxCoord)) time, O(N) space',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '875318608908',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: ClawContraptionPart2Visualizer,
};
