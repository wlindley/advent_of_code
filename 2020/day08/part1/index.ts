import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { HandheldHaltingPart1Visualizer } from './viz/HandheldHaltingPart1Visualizer';

const EXAMPLE_INPUT = [
  'nop +0',
  'acc +1',
  'jmp +4',
  'acc +3',
  'jmp -3',
  'acc -99',
  'acc +1',
  'jmp -4',
  'acc +6',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2020,
    day: 8,
    part: 1,
    title: 'Handheld Halting',
    puzzleUrl: 'https://adventofcode.com/2020/day/8',
    summary: 'Execute handheld boot code until an instruction repeats and report the accumulator.',
    algorithmSummary:
      'Parse instructions into a BootProgram, execute steps with a Uint8Array visited bitmap under LOOP_ACCUMULATOR_POLICY, and return the BigInt accumulator before revisit.',
    complexity: 'O(N) time and O(N) space over program length N',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '5',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: HandheldHaltingPart1Visualizer,
};
