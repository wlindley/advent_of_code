import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { DockingPart2Visualizer } from './viz/DockingPart2Visualizer';

const EXAMPLE_INPUT = [
  'mask = 000000000000000000000000000000X1001X',
  'mem[42] = 100',
  'mask = 00000000000000000000000000000000X0XX',
  'mem[26] = 1',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2020,
    day: 14,
    part: 2,
    title: 'Docking Data',
    puzzleUrl: 'https://adventofcode.com/2020/day/14#part2',
    summary:
      'Execute 36-bit bitmask and memory-write instructions where mask bits transform target addresses into floating subsets, then sum all non-zero memory cells.',
    algorithmSummary:
      'Parse lines into a DockingProgram, apply DECODER_V2_POLICY to expand 2^k floating address combinations via BigInt submask iteration, and store raw values in a sparse MemoryBank with an incremental sum.',
    complexity: 'O(N * 2^k) time and O(U) sparse storage across N instructions, k floating bits per write, and U distinct non-zero addresses',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '208',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: DockingPart2Visualizer,
};
