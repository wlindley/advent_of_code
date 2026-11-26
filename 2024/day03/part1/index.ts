import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { CorruptedMemoryVisualizer } from './viz/CorruptedMemoryVisualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2024,
    day: 3,
    part: 1,
    title: 'Mull It Over',
    puzzleUrl: 'https://adventofcode.com/2024/day/3',
    summary: 'Scan corrupted memory for exact mul(X,Y) instructions with 1–3 digit operands and sum their products.',
    algorithmSummary:
      'Run a single-pass zero-backtracking charCodeAt scanner across the continuous stream, resume at mismatch index c so inner prefixes are never skipped, and accumulate x * y.',
    complexity: 'O(N) time across N input characters, O(M) space for M matched instructions',
  },
  exampleInput: 'xmul(2,4)%&mul[3,7]!@^do_not_mul(5,5)+mul(32,64]then(mul(11,8)mul(8,5))',
  exampleAnswer: '161',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: CorruptedMemoryVisualizer,
};
