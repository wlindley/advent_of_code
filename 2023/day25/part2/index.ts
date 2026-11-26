import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { SnowProductionFinaleVisualizer } from './viz/SnowProductionFinaleVisualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2023,
    day: 25,
    part: 2,
    title: 'Snowverload',
    puzzleUrl: 'https://adventofcode.com/2023/day/25#part2',
    summary:
      'Advent of Code 2023 finale star: push the big red button once all 49 stars across Days 1–25 are collected to restore global snow production and claim the 50th star.',
    algorithmSummary:
      'Delegates directly to shared/core createFinaleSolver(50) to verify all 49 prerequisite stars and emit bounded 50-star canopy illumination frames, verified live on adventofcode.com.',
    complexity: 'O(1) verification, O(S) illumination trace',
  },
  exampleInput: '49',
  exampleAnswer: '0',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: SnowProductionFinaleVisualizer,
};
