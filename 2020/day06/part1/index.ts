import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { CustomCustomsPart1Visualizer } from './viz/CustomCustomsPart1Visualizer';

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
    part: 1,
    title: 'Custom Customs',
    puzzleUrl: 'https://adventofcode.com/2020/day/6',
    summary: 'Encode each person’s "yes" answers as a 26-bit mask and sum per-group union counts.',
    algorithmSummary: 'Parse blank-line-separated groups, bitwise OR declarations per group under ANY_YES_POLICY, and sum popcount26.',
    complexity: 'O(N) parse & bitwise aggregation across total input characters',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '11',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: CustomCustomsPart1Visualizer,
};
