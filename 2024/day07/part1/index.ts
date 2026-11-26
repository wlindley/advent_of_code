import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { BridgeRepairPart1Visualizer } from './viz/BridgeRepairPart1Visualizer';

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
    part: 1,
    title: 'Bridge Repair',
    puzzleUrl: 'https://adventofcode.com/2024/day/7',
    summary:
      'Sum target values of calibration equations that can be satisfied left-to-right using + and *.',
    algorithmSummary:
      'Parse lines into frozen BigInt CalibrationEquation instances and solve right-to-left via reverse DFS, pruning non-divisible multiplication branches and under-1 subtractions.',
    complexity: 'O(N * 2^(k-1)) worst-case, heavily pruned in practice; O(k) stack space',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '3749',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: BridgeRepairPart1Visualizer,
};
