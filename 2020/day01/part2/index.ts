import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { ExpenseRepairPart2Visualizer } from './viz/ExpenseRepairPart2Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2020,
    day: 1,
    part: 2,
    title: 'Report Repair',
    puzzleUrl: 'https://adventofcode.com/2020/day/1#part2',
    summary: 'Find the three expense entries that sum to 2020 and return their product.',
    algorithmSummary: 'Sort entries ascending, fix one anchor entry, and run a two-pointer scan to locate the 2020 triple.',
    complexity: 'O(N^2) time, O(N) space',
  },
  exampleInput: '1721\n979\n366\n299\n675\n1456',
  exampleAnswer: '241861950',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: ExpenseRepairPart2Visualizer,
};
