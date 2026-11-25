import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { VerticalWorksheetVisualizer } from './viz/VerticalWorksheetVisualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2025,
    day: 6,
    part: 2,
    title: 'Trash Compactor',
    puzzleUrl: 'https://adventofcode.com/2025/day/6#part2',
    summary: 'Decode vertical top-to-bottom column operands right-to-left per worksheet block and sum all problem results.',
    algorithmSummary:
      'Reuse column-segmented ProblemBlocks, scan each block right-to-left reading top-to-bottom digits (MSD to LSD) into BigInt operands, evaluate + or *, and sum.',
    complexity: 'O(R * W) time, O(R * W) space',
  },
  exampleInput: [
    '123 328  51 64 ',
    ' 45 64  387 23 ',
    '  6 98  215 314',
    '*   +   *   +  ',
  ].join('\n'),
  exampleAnswer: '3263827',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: VerticalWorksheetVisualizer,
};
