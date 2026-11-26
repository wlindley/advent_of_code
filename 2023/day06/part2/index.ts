import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { RaceVisualizer } from './viz/RaceVisualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2023,
    day: 6,
    part: 2,
    title: 'Wait For It',
    puzzleUrl: 'https://adventofcode.com/2023/day/6#part2',
    summary:
      'Fix kerning across the Time and Distance rows into one merged race and count integer button-hold durations that strictly beat the record.',
    algorithmSummary:
      'Strip internal whitespace from Time/Distance rows into a single BigInt BoatRace and solve h(T - h) >= D + 1 in closed form via bigintIsqrt.',
    complexity: 'O(log T) arithmetic steps for BigInt isqrt, O(1) space',
  },
  exampleInput: [
    'Time:      7  15   30',
    'Distance:  9  40  200',
  ].join('\n'),
  exampleAnswer: '71503',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: RaceVisualizer,
};
