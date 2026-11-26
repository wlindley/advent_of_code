import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { FactoryJoltageVisualizer } from './viz/FactoryJoltageVisualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2025,
    day: 10,
    part: 2,
    title: 'Factory — Part Two',
    puzzleUrl: 'https://adventofcode.com/2025/day/10',
    summary: 'Find the minimum total non-negative integer button presses across all factory machines to reach each target joltage counter vector.',
    algorithmSummary:
      'Reduce A x = b to exact RREF over Q (keeping tightly bounded buttons as free columns), clear denominators to BigInt identities, and run branch-and-bound with exact suffix-slack tightening.',
    complexity: 'O(L * B * min(L, B)) RREF + bounded nullspace branch-and-bound per machine',
  },
  exampleInput: [
    '[.##.] (3) (1,3) (2) (2,3) (0,2) (0,1) {3,5,4,7}',
    '[...#.] (0,2,3,4) (2,3) (0,4) (0,1,2) (1,2,3,4) {7,5,12,7,2}',
    '[.###.#] (0,1,2,3,4) (0,3,4) (0,1,2,4,5) (1,2) {10,11,11,5,10,5}',
  ].join('\n'),
  exampleAnswer: '33',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: FactoryJoltageVisualizer,
};
