import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { ConditionalMulVisualizer } from './viz/ConditionalMulVisualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2024,
    day: 3,
    part: 2,
    title: 'Mull It Over: Conditional Execution',
    puzzleUrl: 'https://adventofcode.com/2024/day/3#part2',
    summary: 'Execute mul(X,Y) instructions gated by do() and don\'t() control tokens across corrupted memory.',
    algorithmSummary:
      'Scan the continuous stream once for mul(X,Y), do(), and don\'t() tokens, then fold a single boolean gate across ordered instructions to sum only enabled products.',
    complexity: 'O(N) time across N input characters, O(K) space for K matched instructions',
  },
  exampleInput: "xmul(2,4)&mul[3,7]!^don't()_mul(5,5)+mul(32,64](mul(11,8)undo()?mul(8,5))",
  exampleAnswer: '48',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: ConditionalMulVisualizer,
};
