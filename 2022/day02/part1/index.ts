import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { RpsScoreboardVisualizer } from './viz/RpsScoreboardVisualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2022,
    day: 2,
    part: 1,
    title: 'Rock Paper Scissors',
    puzzleUrl: 'https://adventofcode.com/2022/day/2',
    summary: 'Interpret each strategy guide response (X/Y/Z) directly as Rock, Paper, or Scissors and sum round scores.',
    algorithmSummary:
      'Map opponent and player tokens into {0, 1, 2} shapes, evaluate outcome via (player - opponent + 1) mod 3, and sum shape + outcome points in O(N).',
    complexity: 'O(N) time, O(1) space',
  },
  exampleInput: 'A Y\nB X\nC Z',
  exampleAnswer: '15',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: RpsScoreboardVisualizer,
};
