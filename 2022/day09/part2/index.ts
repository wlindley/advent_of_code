import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { RopeBridgePart2Visualizer } from './viz/RopeBridgePart2Visualizer';

const EXAMPLE_INPUT = ['R 5', 'U 8', 'L 8', 'D 3', 'R 17', 'D 10', 'L 25', 'U 20'].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2022,
    day: 9,
    part: 2,
    title: 'Rope Bridge',
    puzzleUrl: 'https://adventofcode.com/2022/day/9#part2',
    summary:
      'Simulate a 10-knot rope head following cardinal steps and count distinct lattice cells visited by its tail.',
    algorithmSummary:
      'Propagate 10-knot Int32Array chain steps with Chebyshev adjacency checks, early-break optimization, and adaptive dense/sparse tail tracking.',
    complexity: 'O(S) time, O(U) to O(A) space',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '36',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: RopeBridgePart2Visualizer,
};
