import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Part1Visualizer } from './viz/Part1Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2021,
    day: 1,
    part: 1,
    title: 'Sonar Sweep',
    puzzleUrl: 'https://adventofcode.com/2021/day/1',
    summary: 'Count how many consecutive integer depth readings are strictly greater than the previous reading.',
    algorithmSummary:
      'Parse depth readings into an immutable SonarReport and apply stride W = 1 window cancellation in a single linear pass.',
    complexity: 'O(N) time, O(N) parsed storage (O(1) extra sweep space)',
  },
  exampleInput: '199\n200\n208\n210\n200\n207\n240\n269\n260\n263',
  exampleAnswer: '7',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: Part1Visualizer,
};
