import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { BatteryRackVisualizer } from './viz/BatteryRackVisualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2025,
    day: 3,
    part: 1,
    title: 'Lobby',
    puzzleUrl: 'https://adventofcode.com/2025/day/3',
    summary: 'Select two ordered battery cells per bank to maximize each two-digit joltage, then sum across all banks.',
    algorithmSummary:
      'Maintain a monotonic non-increasing index stack with strict > tie-breaking to pick the k=2 lexicographically earliest maximum digits per bank.',
    complexity: 'O(N * L) time, O(L) space',
  },
  exampleInput: [
    '987654321111111',
    '811111111111119',
    '234234234234278',
    '818181911112111',
  ].join('\n'),
  exampleAnswer: '357',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: BatteryRackVisualizer,
};
