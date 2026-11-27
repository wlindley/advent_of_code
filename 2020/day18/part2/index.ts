import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { OperationOrderPart2Visualizer } from './viz/OperationOrderPart2Visualizer';

const EXAMPLE_INPUT = [
  '1 + 2 * 3 + 4 * 5 + 6',
  '1 + (2 * 3) + (4 * (5 + 6))',
  '2 * 3 + (4 * 5)',
  '5 + (8 * 3 + 9 + 3 * 4 * 3)',
  '5 * 9 * (7 * 3 * 3 + 9 * 3 + (8 + 6 * 4))',
  '((2 + 4 * 9) * (6 + 9 * 8 + 6) + 6) + 2 + 4 * 2',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2020,
    day: 18,
    part: 2,
    title: 'Operation Order',
    puzzleUrl: 'https://adventofcode.com/2020/day/18#part2',
    summary:
      'Evaluate multi-line integer expressions where addition (+) takes precedence over multiplication (*) inside parenthesized groups, then sum all results.',
    algorithmSummary:
      'Tokenize each line and construct a polymorphic expression AST with a Pratt parser parameterized by ADD_BEFORE_MUL_POLICY, then sum post-order BigInt evaluations.',
    complexity: 'O(N) time and space across N total tokens',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '694173',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: OperationOrderPart2Visualizer,
};
