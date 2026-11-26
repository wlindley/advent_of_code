import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { BridgeRepairPart2Visualizer } from './viz/BridgeRepairPart2Visualizer';

const EXAMPLE_INPUT = [
  '190: 10 19',
  '3267: 81 40 27',
  '83: 17 5',
  '156: 15 6',
  '7290: 6 8 6 15',
  '161011: 16 10 13',
  '192: 17 8 14',
  '21037: 9 7 18 13',
  '292: 11 6 16 20',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2024,
    day: 7,
    part: 2,
    title: 'Bridge Repair',
    puzzleUrl: 'https://adventofcode.com/2024/day/7#part2',
    summary:
      'Sum target values of calibration equations solvable left-to-right using +, *, and concatenation (||).',
    algorithmSummary:
      'Solve right-to-left via reverse DFS over BigInt equations, pruning non-divisible multiplications, under-1 subtractions, and non-matching decimal suffixes with positive-prefix checks.',
    complexity: 'O(N * 3^(k-1)) worst-case, heavily pruned in practice; O(k) stack space',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '11387',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: BridgeRepairPart2Visualizer,
};
