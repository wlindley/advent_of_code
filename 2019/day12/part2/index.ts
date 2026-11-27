import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Visualizer } from './viz/Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2019,
    day: 12,
    part: 2,
    title: 'The N-Body Problem',
    puzzleUrl: 'https://adventofcode.com/2019/day/12#part2',
    summary:
      'Find the exact simulation step when the four moons first return to an earlier position-and-velocity state across all three axes simultaneously.',
    algorithmSummary:
      'Exploit axis separability and symplectic time-reversibility to find each independent 1D axis period (returning to step 0) via Int32Array state comparison, then combine periods with BigInt LCM.',
    complexity: 'O(Px + Py + Pz) time and O(M) memory for per-axis cycle lengths and M moons',
  },
  exampleInput: [
    '<x=-1, y=0, z=2>',
    '<x=2, y=-10, z=-7>',
    '<x=4, y=-8, z=8>',
    '<x=3, y=5, z=-1>',
  ].join('\n'),
  exampleAnswer: '2772',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer,
};
