import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { IntervalProbeVisualizer } from './viz/IntervalProbeVisualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2025,
    day: 5,
    part: 1,
    title: 'Cafeteria',
    puzzleUrl: 'https://adventofcode.com/2025/day/5',
    summary: 'Count available ingredient IDs that fall within any inclusive fresh-ID range.',
    algorithmSummary:
      'Sort and coalesce overlapping or adjacent fresh intervals into an immutable IntervalUnion, then binary-search each available ID.',
    complexity: 'O(R log R + Q log R) time, O(R) space',
  },
  exampleInput: ['3-5', '10-14', '16-20', '12-18', '', '1', '5', '8', '11', '17', '32'].join('\n'),
  exampleAnswer: '3',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: IntervalProbeVisualizer,
};
