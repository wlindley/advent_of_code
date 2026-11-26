import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { TopThreePodiumVisualizer } from './viz/TopThreePodiumVisualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2022,
    day: 1,
    part: 2,
    title: 'Calorie Counting — Top Three',
    puzzleUrl: 'https://adventofcode.com/2022/day/1#part2',
    summary: 'Find the top three Elves carrying the most calories and sum their combined totals.',
    algorithmSummary:
      'Parse contiguous integer blocks into Elf inventories and maintain a bounded 3-slot insertion leaderboard in a single O(N) pass.',
    complexity: 'O(N) time, O(1) extra tracking space',
  },
  exampleInput: '1000\n2000\n3000\n\n4000\n\n5000\n6000\n\n7000\n8000\n9000\n\n10000',
  exampleAnswer: '45000',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: TopThreePodiumVisualizer,
};
