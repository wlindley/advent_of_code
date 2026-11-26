import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { RaceVisualizer } from './viz/RaceVisualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2023,
    day: 6,
    part: 1,
    title: 'Wait For It',
    puzzleUrl: 'https://adventofcode.com/2023/day/6',
    summary:
      'For each race duration and record distance, count integer button-hold durations whose travel distance strictly beats the record and multiply the counts together.',
    algorithmSummary:
      'Parse columnar Time/Distance pairs into BigInt BoatRaces and solve h(T - h) >= D + 1 in closed form using exact integer square root (bigintIsqrt).',
    complexity: 'O(N) arithmetic steps per sheet, O(N) space',
  },
  exampleInput: [
    'Time:      7  15   30',
    'Distance:  9  40  200',
  ].join('\n'),
  exampleAnswer: '288',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: RaceVisualizer,
};
