import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { WorksheetTapeVisualizer } from './viz/WorksheetTapeVisualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2025,
    day: 6,
    part: 1,
    title: 'Trash Compactor',
    puzzleUrl: 'https://adventofcode.com/2025/day/6',
    summary: 'Parse column-segmented worksheet problems, evaluate horizontal operands per block, and sum all results.',
    algorithmSummary:
      'Segment padded worksheet lines at all-space separator columns into ProblemBlocks, parse each row as a BigInt operand, and fold with + or *.',
    complexity: 'O(R * W) time, O(R * W) space',
  },
  exampleInput: [
    '123 328  51 64 ',
    ' 45 64  387 23 ',
    '  6 98  215 314',
    '*   +   *   +  ',
  ].join('\n'),
  exampleAnswer: '4277556',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: WorksheetTapeVisualizer,
};
