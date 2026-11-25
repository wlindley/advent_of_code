import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { WarehouseCanvasVisualizer } from './viz/WarehouseCanvasVisualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2025,
    day: 4,
    part: 1,
    title: 'Printing Department',
    puzzleUrl: 'https://adventofcode.com/2025/day/4',
    summary: 'Count paper rolls whose 8-neighbor occupancy degree is strictly below 4.',
    algorithmSummary:
      'Build a zero-padded occupancy buffer and sum the 8 neighbor offsets branchlessly for every cell to classify accessible rolls in one pass.',
    complexity: 'O(R * C) time, O(R * C) space',
  },
  exampleInput: [
    '..@@.@@@@.', '@@@.@.@.@@', '@@@@@.@.@@', '@.@@@@..@.', '@@.@@@@.@@',
    '.@@@@@@@.@', '.@.@.@.@@@', '@.@@@.@@@@', '.@@@@@@@@.', '@.@.@@@.@.',
  ].join('\n'),
  exampleAnswer: '13',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: WarehouseCanvasVisualizer,
};
