import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Part1Visualizer } from './viz/Part1Visualizer';

const EXAMPLE_INPUT = [
  '0,9 -> 5,9',
  '8,0 -> 0,8',
  '9,4 -> 3,4',
  '2,2 -> 2,1',
  '7,0 -> 7,4',
  '6,4 -> 2,0',
  '0,9 -> 2,9',
  '3,4 -> 1,4',
  '0,0 -> 8,8',
  '5,5 -> 8,2',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2021,
    day: 5,
    part: 1,
    title: 'Hydrothermal Venture',
    puzzleUrl: 'https://adventofcode.com/2021/day/5',
    summary: 'Count lattice points covered by at least two horizontal or vertical hydrothermal vent segments.',
    algorithmSummary:
      'Filter segments by AXIS_ALIGNED_POLICY, compute tight included bounds, and rasterize segments via a dense Uint32Array grid or sparse Map accumulator while counting depth-2 transitions.',
    complexity: 'O(N + P) time, O(min(A, P)) space where P is total rasterized points',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '5',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: Part1Visualizer,
};
