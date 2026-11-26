import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Visualizer } from './viz/Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2019,
    day: 5,
    part: 2,
    title: 'Sunny with a Chance of Asteroids',
    puzzleUrl: 'https://adventofcode.com/2019/day/5#part2',
    summary:
      'Execute the TEST diagnostic program with conditional jumps and comparison opcodes for thermal radiator controller ID 5.',
    algorithmSummary:
      'Decode opcodes 1..8 and parameter modes 0/1, supply system ID 5 to opcode 3, execute lazy conditional jumps and comparisons, and return the final diagnostic code.',
    complexity: 'O(N + S) time, O(N + K) memory for N tape cells, S steps, and K outputs',
  },
  exampleInput:
    '3,21,1008,21,8,20,1005,20,22,107,8,21,20,1006,20,31,1106,0,36,98,0,0,1002,21,125,20,4,20,1105,1,46,104,999,1105,1,46,1101,1000,1,20,4,20,1105,1,46,98,99',
  exampleAnswer: '999',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer,
};
