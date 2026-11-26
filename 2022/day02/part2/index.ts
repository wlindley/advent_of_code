import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { OutcomeStrategyVisualizer } from './viz/OutcomeStrategyVisualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2022,
    day: 2,
    part: 2,
    title: 'Rock Paper Scissors',
    puzzleUrl: 'https://adventofcode.com/2022/day/2#part2',
    summary: 'Interpret each strategy response (X/Y/Z) as Loss, Draw, or Win, derive the required player shape, and sum round scores.',
    algorithmSummary:
      'Map opponent shape into {0, 1, 2} and response into desired outcome {0, 1, 2}, invert via (opponent + outcome - 1) mod 3, and sum shape + outcome points in O(N).',
    complexity: 'O(N) time, O(1) space',
  },
  exampleInput: 'A Y\nB X\nC Z',
  exampleAnswer: '12',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: OutcomeStrategyVisualizer,
};
