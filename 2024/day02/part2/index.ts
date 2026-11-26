import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { ProblemDampenerVisualizer } from './viz/ProblemDampenerVisualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2024,
    day: 2,
    part: 2,
    title: 'Red-Nosed Reports: Problem Dampener',
    puzzleUrl: 'https://adventofcode.com/2024/day/2#part2',
    summary: 'Count reactor reports that are safe natively or become strictly monotonic with step sizes in 1..3 after removing one level.',
    algorithmSummary:
      'Locate the first adjacent step failure, test up to 2-3 candidate skip indices around the failure via zero-allocation single-pass verification, and count safe reports.',
    complexity: 'O(L) time across L total levels, O(1) extra space per report',
  },
  exampleInput: '7 6 4 2 1\n1 2 7 8 9\n9 7 6 2 1\n1 3 2 4 5\n8 6 4 4 1\n1 3 6 7 9',
  exampleAnswer: '4',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: ProblemDampenerVisualizer,
};
