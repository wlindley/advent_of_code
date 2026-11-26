import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import {
  CrossedWiresPart2Visualizer,
  PART2_EXAMPLE_INPUT,
} from './viz/CrossedWiresPart2Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2024,
    day: 24,
    part: 2,
    title: 'Crossed Wires',
    puzzleUrl: 'https://adventofcode.com/2024/day/24#part2',
    summary:
      'Identify the four pairs of swapped gate output wires preventing an N-bit ripple-carry adder circuit from computing x + y.',
    algorithmSummary:
      'Walk ripple-carry bit slices 0..N-1 to locate missing or miswired half/full-adder gates, search bounded candidate output swaps, and verify functional equivalence across binary test vectors.',
    complexity: 'O(N) slice traversal with bounded backtracking over candidate gate swaps',
  },
  exampleInput: PART2_EXAMPLE_INPUT,
  exampleAnswer: 'c00,c02,g01,h03,p01,z00,z02,z03',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: CrossedWiresPart2Visualizer,
};
