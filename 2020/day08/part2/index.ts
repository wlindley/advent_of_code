import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { HandheldHaltingPart2Visualizer } from './viz/HandheldHaltingPart2Visualizer';

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
    part: 2,
    title: 'Handheld Halting',
    puzzleUrl: 'https://adventofcode.com/2020/day/8#part2',
    summary: 'Repair one jmp or nop instruction so the boot code terminates cleanly and report the accumulator.',
    algorithmSummary:
      'Run reverse BFS from exit (pc = N) over the instruction graph, toggle the unique visited jmp/nop reaching termination under REPAIR_BOOT_POLICY, and execute to exit.',
    complexity: 'O(N) time and O(N) space over program length N',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '8',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: HandheldHaltingPart2Visualizer,
};
