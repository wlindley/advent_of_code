import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Visualizer } from './viz/Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2019,
    day: 7,
    part: 1,
    title: 'Amplification Circuit',
    puzzleUrl: 'https://adventofcode.com/2019/day/7',
    summary:
      'Maximize the output signal across five series-chained Intcode amplifiers over all phase permutations 0..4.',
    algorithmSummary:
      'Generate all 5! lexicographic phase permutations via Narayana iteration, run five isolated Intcode VMs sequentially from input 0, and retain the maximum thruster signal.',
    complexity: 'O(P! * S) time, O(N + P) memory for P = 5 stages, N tape cells, and S steps per stage',
  },
  exampleInput: '3,15,3,16,1002,16,10,16,1,16,15,15,4,15,99,0,0',
  exampleAnswer: '43210',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer,
};
