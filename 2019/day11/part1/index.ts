import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Visualizer } from './viz/Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2019,
    day: 11,
    part: 1,
    title: 'Space Police',
    puzzleUrl: 'https://adventofcode.com/2019/day/11',
    summary:
      'Simulate an emergency hull-painting Intcode robot starting on an all-black hull and count distinct panels painted at least once.',
    algorithmSummary:
      'Drive the complete sparse-memory Intcode VM via a run-first camera feedback loop, feeding current panel color (0/1) on input pause and reading (color, turn) pairs to update a sparse coordinate map and sampled trace.',
    complexity: 'O(V + S) time and O(P) memory for V VM steps, S robot steps, and P distinct painted panels',
  },
  exampleInput:
    '3,43,104,1,104,0,3,43,104,0,104,0,3,43,104,1,104,0,3,43,104,1,104,0,3,43,104,0,104,1,3,43,104,1,104,0,3,43,104,1,104,0,99',
  exampleAnswer: '6',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer,
};
