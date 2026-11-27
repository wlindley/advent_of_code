import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Visualizer } from './viz/Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2019,
    day: 12,
    part: 1,
    title: 'The N-Body Problem',
    puzzleUrl: 'https://adventofcode.com/2019/day/12',
    summary:
      'Simulate four moons moving under pairwise integer gravity along independent X/Y/Z axes for 1000 steps and compute total system energy. (AoC prose checks 10 steps = 179 on Example 1 and 100 steps = 1940 on Example 2; exampleAnswer is Example 1 at 1000 steps.)',
    algorithmSummary:
      'Decompose 3D N-body dynamics into three independent 1D Int32Array position/velocity pairs, applying pairwise < / > gravity updates before velocity integration for 1000 ticks and summing potential × kinetic energy.',
    complexity: 'O(T · M²) time and O(M) memory for T simulation steps and M moons',
  },
  exampleInput: [
    '<x=-1, y=0, z=2>',
    '<x=2, y=-10, z=-7>',
    '<x=4, y=-8, z=8>',
    '<x=3, y=5, z=-1>',
  ].join('\n'),
  exampleAnswer: '183',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer,
};
