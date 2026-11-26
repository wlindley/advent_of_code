import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { ChronospatialPart1Visualizer } from './viz/ChronospatialPart1Visualizer';

const EXAMPLE_INPUT = [
  'Register A: 729',
  'Register B: 0',
  'Register C: 0',
  '',
  'Program: 0,1,5,4,3,0',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2024,
    day: 17,
    part: 1,
    title: 'Chronospatial Computer',
    puzzleUrl: 'https://adventofcode.com/2024/day/17',
    summary:
      'Simulate a 3-bit virtual machine with three arbitrary-precision registers (A, B, C) and eight opcodes until the instruction pointer halts past the program end, collecting emitted values.',
    algorithmSummary:
      'Pure BigInt VM executing an exhaustive opcode lookup table with shift-safe division by 2^combo and bounded step-cap and 2-pass trace sampling.',
    complexity: 'O(S) time over S executed steps, O(K) trace frame memory',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '4,6,3,5,6,3,5,2,1,0',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: ChronospatialPart1Visualizer,
};
