import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { WarehousePeelingVisualizer } from './viz/WarehousePeelingVisualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2025,
    day: 4,
    part: 2,
    title: 'Printing Department',
    puzzleUrl: 'https://adventofcode.com/2025/day/4#part2',
    summary: 'Iteratively peel accessible paper rolls (<4 neighbors) in waves until a stable 4-core remains.',
    algorithmSummary:
      'Maintain padded occupancy and neighbor degrees; peel <4-degree frontier waves with dual-offset incremental decrements in O(R * C) time.',
    complexity: 'O(R * C) time, O(R * C) space',
  },
  exampleInput: [
    '..@@.@@@@.', '@@@.@.@.@@', '@@@@@.@.@@', '@.@@@@..@.', '@@.@@@@.@@',
    '.@@@@@@@.@', '.@.@.@.@@@', '@.@@@.@@@@', '.@@@@@@@@.', '@.@.@@@.@.',
  ].join('\n'),
  exampleAnswer: '43',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: WarehousePeelingVisualizer,
};
