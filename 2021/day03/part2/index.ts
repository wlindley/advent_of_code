import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Part2Visualizer } from './viz/Part2Visualizer';

const EXAMPLE_INPUT = [
  '00100',
  '11110',
  '10110',
  '10111',
  '10101',
  '01111',
  '00111',
  '11100',
  '10000',
  '11001',
  '00010',
  '01010',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2021,
    day: 3,
    part: 2,
    title: 'Binary Diagnostic',
    puzzleUrl: 'https://adventofcode.com/2021/day/3#part2',
    summary: 'Iteratively filter diagnostic rows by bit criteria to determine oxygen generator and CO2 scrubber ratings.',
    algorithmSummary:
      'Reuse DiagnosticReport bit counting and row filtering with unanimous-bit guarding; narrow oxygen (most-common, ties 1) and CO2 (least-common, ties 0) lanes until locked, then multiply exact BigInt ratings.',
    complexity: 'O(N * W) time, O(N * W) parsed storage',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '230',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: Part2Visualizer,
};
