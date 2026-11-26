import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Part2Visualizer } from './viz/Part2Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2021,
    day: 1,
    part: 2,
    title: 'Sonar Sweep',
    puzzleUrl: 'https://adventofcode.com/2021/day/1#part2',
    summary:
      'Count how many consecutive three-measurement sliding-window sums are strictly greater than the previous window sum.',
    algorithmSummary:
      'Parse depth readings into an immutable SonarReport and apply stride W = 3 window cancellation (depth[i] > depth[i - 3]) in a single linear pass.',
    complexity: 'O(N) time, O(N) parsed storage (O(1) extra sweep space)',
  },
  exampleInput: '199\n200\n208\n210\n200\n207\n240\n269\n260\n263',
  exampleAnswer: '5',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: Part2Visualizer,
};
