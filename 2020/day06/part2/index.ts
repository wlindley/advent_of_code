import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { CustomCustomsPart2Visualizer } from './viz/CustomCustomsPart2Visualizer';

const EXAMPLE_INPUT = [
  'abc',
  '',
  'a',
  'b',
  'c',
  '',
  'ab',
  'ac',
  '',
  'a',
  'a',
  'a',
  'a',
  '',
  'b',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2020,
    day: 6,
    part: 2,
    title: 'Custom Customs',
    puzzleUrl: 'https://adventofcode.com/2020/day/6#part2',
    summary: 'Encode each person’s "yes" answers as a 26-bit mask and sum per-group intersection counts.',
    algorithmSummary: 'Parse blank-line-separated groups, bitwise AND declarations per group under ALL_YES_POLICY, and sum popcount26.',
    complexity: 'O(N) parse & bitwise aggregation across total input characters',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '6',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: CustomCustomsPart2Visualizer,
};
