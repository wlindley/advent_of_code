import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { EXAMPLE_BEAM_PROGRAM } from '../shared';
import { solver } from './domain';
import { Visualizer } from './viz/Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2019,
    day: 19,
    part: 1,
    title: 'Tractor Beam',
    puzzleUrl: 'https://adventofcode.com/2019/day/19',
    summary:
      'Query the Intcode drone control program across a 50x50 grid near the emitter to count all coordinates pulled by the stationary tractor beam.',
    algorithmSummary:
      'Run fresh memoized Intcode VM instances per coordinate and sweep rows 0..49 monotonically using left/right beam boundary tracking with an exact cone empty-row bound.',
    complexity: 'O(N * K) VM runs (O(N) boundary queries + interior skips) and O(N) span memory for N = 50',
  },
  exampleInput: EXAMPLE_BEAM_PROGRAM,
  exampleAnswer: '674',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer,
};
