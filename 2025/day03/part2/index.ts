import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { JoltageRegisterVisualizer } from './viz/JoltageRegisterVisualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2025,
    day: 3,
    part: 2,
    title: 'Lobby',
    puzzleUrl: 'https://adventofcode.com/2025/day/3#part2',
    summary: 'Select twelve ordered battery cells per bank to maximize each twelve-digit joltage, then sum across all banks.',
    algorithmSummary:
      'Maintain a monotonic non-increasing index stack with drop budget L - 12 and strict > tie-breaking, keeping the first 12 indices per bank.',
    complexity: 'O(N * L) time, O(L) space',
  },
  exampleInput: [
    '987654321111111',
    '811111111111119',
    '234234234234278',
    '818181911112111',
  ].join('\n'),
  exampleAnswer: '3121910778619',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: JoltageRegisterVisualizer,
};
