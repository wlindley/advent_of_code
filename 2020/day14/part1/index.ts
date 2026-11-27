import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { DockingPart1Visualizer } from './viz/DockingPart1Visualizer';

const EXAMPLE_INPUT = [
  'mask = XXXXXXXXXXXXXXXXXXXXXXXXXXXXX1XXXX0X',
  'mem[8] = 11',
  'mem[7] = 101',
  'mem[8] = 0',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2020,
    day: 14,
    part: 1,
    title: 'Docking Data',
    puzzleUrl: 'https://adventofcode.com/2020/day/14',
    summary:
      'Execute 36-bit bitmask and memory-write instructions where active mask bits override written values, then sum all non-zero memory cells.',
    algorithmSummary:
      'Parse lines into a DockingProgram, apply DECODER_V1_POLICY ((value & floatingMask) | setMask) per write into a sparse BigInt MemoryBank maintaining an incremental sum.',
    complexity: 'O(N) time and O(U) sparse storage across N instructions and U distinct non-zero addresses',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '165',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: DockingPart1Visualizer,
};
