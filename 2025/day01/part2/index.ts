import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { ClickDialVisualizer } from './viz/ClickDialVisualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2025,
    day: 1,
    part: 2,
    title: 'Secret Entrance — CLICK Method',
    puzzleUrl: 'https://adventofcode.com/2025/day/1#part2',
    summary: 'Count every individual click during left/right turns on a 0–99 dial from 50 that hits 0.',
    algorithmSummary:
      'Compute the first-hit click offset from the current position in each direction, count 1 + floor((d - firstHit) / 100) in O(1) per rotation, and advance modularly.',
    complexity: 'O(N) time, O(1) space',
  },
  exampleInput: 'L68\nL30\nR48\nL5\nR60\nL55\nL1\nL99\nR14\nL82',
  exampleAnswer: '6',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: ClickDialVisualizer,
};
