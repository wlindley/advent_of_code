import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { DialVisualizer } from './viz/DialVisualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2025,
    day: 1,
    part: 1,
    title: 'Secret Entrance',
    puzzleUrl: 'https://adventofcode.com/2025/day/1',
    summary: 'Simulate modular left/right turns on a 0–99 dial from 50 and count how often it lands on 0.',
    algorithmSummary:
      'Reduce each rotation distance modulo 100, step via Euclidean modulo, and tally exact 0 landings in one pass.',
    complexity: 'O(N) time, O(1) space',
  },
  exampleInput: 'L68\nL30\nR48\nL5\nR60\nL55\nL1\nL99\nR14\nL82',
  exampleAnswer: '3',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: DialVisualizer,
};
