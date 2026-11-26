import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Visualizer } from './viz/Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2019,
    day: 9,
    part: 1,
    title: 'Sensor Boost',
    puzzleUrl: 'https://adventofcode.com/2019/day/9',
    summary:
      'Execute the BOOST program in test mode (signal 1) on the complete Intcode VM with relative mode, opcode 9, and sparse high memory.',
    algorithmSummary:
      'Run SparseIntcodeMemory with relative base adjustment (opcode 9) and mode 2 addressing, verify a single keycode output with zero diagnostic errors, and capture sampled execution traces.',
    complexity: 'O(S) time, O(N + M) memory for N tape cells, M sparse writes, and S executed steps',
  },
  exampleInput: '1102,34915192,34915192,7,4,7,99,0',
  exampleAnswer: '1219070632396864',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer,
};
