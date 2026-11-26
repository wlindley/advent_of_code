import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { ChiefHistorianFinaleVisualizer } from './viz/ChiefHistorianFinaleVisualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2024,
    day: 25,
    part: 2,
    title: 'Code Chronicle',
    puzzleUrl: 'https://adventofcode.com/2024/day/25#part2',
    summary:
      'Advent of Code 2024 finale star: deliver the complete chronicle of all 49 collected stars across Days 1–25 to claim the 50th and final star.',
    algorithmSummary:
      'Delegates directly to shared/core createFinaleSolver(50) to validate all 49 prerequisite stars and emit bounded 50-star illumination frames, verified live on adventofcode.com.',
    complexity: 'O(1) verification, O(S) illumination trace',
  },
  exampleInput: '49',
  exampleAnswer: '0',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: ChiefHistorianFinaleVisualizer,
};
