import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { ReportSafetyVisualizer } from './viz/ReportSafetyVisualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2024,
    day: 2,
    part: 1,
    title: 'Red-Nosed Reports',
    puzzleUrl: 'https://adventofcode.com/2024/day/2',
    summary: 'Count reactor reports whose levels move strictly monotonically with adjacent step sizes in 1..3.',
    algorithmSummary:
      'Infer expected trend from the first pair, scan adjacent steps from index 0 classifying violations (flat, reversal, jump), and count reports with no failure.',
    complexity: 'O(L) time across L total levels, O(1) extra space per report',
  },
  exampleInput: '7 6 4 2 1\n1 2 7 8 9\n9 7 6 2 1\n1 3 2 4 5\n8 6 4 4 1\n1 3 6 7 9',
  exampleAnswer: '2',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: ReportSafetyVisualizer,
};
