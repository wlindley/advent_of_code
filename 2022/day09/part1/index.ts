import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { RopeBridgePart1Visualizer } from './viz/RopeBridgePart1Visualizer';

const EXAMPLE_INPUT = ['R 4', 'U 4', 'L 3', 'D 1', 'R 4', 'D 1', 'L 5', 'R 2'].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2022,
    day: 9,
    part: 1,
    title: 'Rope Bridge',
    puzzleUrl: 'https://adventofcode.com/2022/day/9',
    summary:
      'Simulate a 2-knot rope head following cardinal steps and count distinct lattice cells visited by its tail.',
    algorithmSummary:
      'Track head/tail coordinates in Int32Array with Chebyshev adjacency checks and adaptive dense/sparse tail-visit tracking.',
    complexity: 'O(S) time, O(U) to O(A) space',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '13',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: RopeBridgePart1Visualizer,
};
