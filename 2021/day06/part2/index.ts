import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Part2Visualizer } from './viz/Part2Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2021,
    day: 6,
    part: 2,
    title: 'Lanternfish',
    puzzleUrl: 'https://adventofcode.com/2021/day/6#part2',
    summary: 'Compute the total lanternfish population after 256 daily reproduction cycles.',
    algorithmSummary:
      'Group fish into a 9-bucket BigInt timer histogram (0..8) and shift cohorts across 256 days without exponential memory or 53-bit integer overflow.',
    complexity: 'O(N + D) time, O(1) space where D = 256 days',
  },
  exampleInput: '3,4,3,1,2',
  exampleAnswer: '26984457539',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: Part2Visualizer,
};
