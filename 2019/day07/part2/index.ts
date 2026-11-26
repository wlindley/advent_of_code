import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Visualizer } from './viz/Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2019,
    day: 7,
    part: 2,
    title: 'Amplification Circuit',
    puzzleUrl: 'https://adventofcode.com/2019/day/7#part2',
    summary:
      'Maximize the final thruster signal across five feedback-looped Intcode amplifiers over all phase permutations 5..9.',
    algorithmSummary:
      'Generate all 5! lexicographic phase permutations via Narayana iteration, run five persistent Intcode VMs in round-robin E->A feedback until all halt, and retain the maximum thruster signal.',
    complexity: 'O(P! * R * S) time, O(N + P) memory for P = 5 stages, R feedback rounds, N tape cells, and S steps per stage',
  },
  exampleInput:
    '3,26,1001,26,-4,26,3,27,1002,27,2,27,1,27,26,27,4,27,1001,28,-1,28,1005,28,6,99,0,0,5',
  exampleAnswer: '139629729',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer,
};
