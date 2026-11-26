import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Visualizer } from './viz/Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2019,
    day: 5,
    part: 1,
    title: 'Sunny with a Chance of Asteroids',
    puzzleUrl: 'https://adventofcode.com/2019/day/5',
    summary:
      'Execute the TEST diagnostic program with position/immediate modes and I/O opcodes for system ID 1.',
    algorithmSummary:
      'Decode opcode and parameter modes per instruction, stream system ID 1 into opcode 3, verify preceding outputs are 0, and return the final diagnostic code.',
    complexity: 'O(N + S) time, O(N + K) memory for N tape cells, S steps, and K outputs',
  },
  exampleInput: '3,0,4,0,99',
  exampleAnswer: '1',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer,
};
