import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { NorthPoleFinaleVisualizer } from './viz/NorthPoleFinaleVisualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2025,
    day: 12,
    part: 2,
    title: 'Christmas Tree Farm',
    puzzleUrl: 'https://adventofcode.com/2025/day/12#part2',
    summary:
      'Advent of Code 2025 finale star: once all 23 prior stars across Days 1–12 are collected, finish decorating the North Pole to claim the 24th and final star.',
    algorithmSummary:
      'Verifies all 23 prerequisite stars are complete and submits the traditional AoC final-star completion trigger (0), rendering an interactive 24-star Christmas tree illumination.',
    complexity: 'O(1) verification, O(S) star-tree animation',
  },
  exampleInput: '23',
  exampleAnswer: '0',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: NorthPoleFinaleVisualizer,
};
