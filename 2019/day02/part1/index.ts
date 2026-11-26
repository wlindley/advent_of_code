import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Visualizer } from './viz/Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2019,
    day: 2,
    part: 1,
    title: '1202 Program Alarm',
    puzzleUrl: 'https://adventofcode.com/2019/day/2',
    summary: 'Patch addresses 1 and 2 with (12, 2), execute Intcode ADD/MUL/HALT instructions, and read address 0.',
    algorithmSummary:
      'Parse comma-separated BigInt memory, patch noun/verb at addresses 1 and 2, and step the Intcode VM until opcode 99 halts.',
    complexity: 'O(N + S) time, O(N) memory for N tape cells and S executed steps',
  },
  exampleInput: '1,0,0,3,2,3,11,0,99,30,40,50,68',
  exampleAnswer: '3500',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer,
};
