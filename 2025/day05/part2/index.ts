import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { IntervalCoalesceVisualizer } from './viz/IntervalCoalesceVisualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2025,
    day: 5,
    part: 2,
    title: 'Cafeteria',
    puzzleUrl: 'https://adventofcode.com/2025/day/5#part2',
    summary: 'Count total unique fresh ingredient IDs covered by the union of all fresh ranges.',
    algorithmSummary:
      'Sort fresh ranges lexicographically by (start, end), coalesce touching or overlapping bands into an IntervalUnion, and sum their bigint lengths.',
    complexity: 'O(R log R) time, O(R) space',
  },
  exampleInput: ['3-5', '10-14', '16-20', '12-18', '', '1', '5', '8', '11', '17', '32'].join('\n'),
  exampleAnswer: '14',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: IntervalCoalesceVisualizer,
};
