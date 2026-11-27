import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Visualizer } from './viz/Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2019,
    day: 16,
    part: 1,
    title: 'Flawed Frequency Transmission',
    puzzleUrl: 'https://adventofcode.com/2019/day/16',
    summary:
      'Apply 100 phases of the Flawed Frequency Transmission digit filter using scaled [0, 1, 0, -1] multiplier blocks and return the leading 8 digits.',
    algorithmSummary:
      'Precompute a prefix-sum array each phase so every output digit sums harmonic positive and negative index ranges in O(N log N) total time per phase.',
    complexity: 'O(P * N log N) time and O(N) memory for N input digits and P phases',
  },
  exampleInput: '80871224585914546619083218645595',
  exampleAnswer: '24176176',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer,
};
