import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Visualizer } from './viz/Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2019,
    day: 9,
    part: 2,
    title: 'Sensor Boost',
    puzzleUrl: 'https://adventofcode.com/2019/day/9#part2',
    summary:
      'Execute the BOOST program in sensor boost mode (signal 2) on the complete Intcode VM with relative mode, opcode 9, and sparse high memory.',
    algorithmSummary:
      'Run SparseIntcodeMemory with relative base adjustment (opcode 9) and mode 2 addressing using sensor signal 2, verify single-output distress coordinates, and capture sampled execution traces.',
    complexity: 'O(S) time, O(N + M) memory for N tape cells, M sparse writes, and S executed steps',
  },
  exampleInput: '109,500,203,0,21208,0,2,1,1205,1,14,104,-1,99,21202,0,1000000000000,2,204,2,99',
  exampleAnswer: '2000000000000',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer,
};
