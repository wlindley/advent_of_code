import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { CalorieLeaderboardVisualizer } from './viz/CalorieLeaderboardVisualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2022,
    day: 1,
    part: 1,
    title: 'Calorie Counting',
    puzzleUrl: 'https://adventofcode.com/2022/day/1',
    summary: 'Group blank-line-separated calorie entries per Elf and find the highest single-Elf total.',
    algorithmSummary:
      'Parse contiguous integer blocks into Elf inventories and track the running maximum total in a single O(N) pass.',
    complexity: 'O(N) time, O(1) extra tracking space',
  },
  exampleInput: '1000\n2000\n3000\n\n4000\n\n5000\n6000\n\n7000\n8000\n9000\n\n10000',
  exampleAnswer: '24000',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: CalorieLeaderboardVisualizer,
};
