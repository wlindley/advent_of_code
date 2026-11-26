import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { ExpenseRepairPart1Visualizer } from './viz/ExpenseRepairPart1Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2020,
    day: 1,
    part: 1,
    title: 'Report Repair',
    puzzleUrl: 'https://adventofcode.com/2020/day/1',
    summary: 'Find the two expense entries that sum to 2020 and return their product.',
    algorithmSummary: 'Sort entries ascending and run a converging two-pointer scan to locate the 2020 pair.',
    complexity: 'O(N log N) time, O(N) space',
  },
  exampleInput: '1721\n979\n366\n299\n675\n1456',
  exampleAnswer: '514579',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: ExpenseRepairPart1Visualizer,
};
