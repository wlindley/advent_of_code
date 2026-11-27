import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Part1Visualizer } from './viz/Part1Visualizer';

const EXAMPLE_INPUT = [
  'NNCB',
  '',
  'CH -> B',
  'HH -> N',
  'CB -> H',
  'NH -> C',
  'HB -> C',
  'HC -> B',
  'HN -> C',
  'NN -> C',
  'BH -> H',
  'NC -> B',
  'NB -> B',
  'BN -> B',
  'BB -> N',
  'BC -> B',
  'CC -> N',
  'CN -> C',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2021,
    day: 14,
    part: 1,
    title: 'Extended Polymerization',
    puzzleUrl: 'https://adventofcode.com/2021/day/14',
    summary:
      'Simulate 10 synchronous pair-insertion rounds from an initial polymer template and compute the difference between the highest and lowest element frequencies.',
    algorithmSummary:
      'Track adjacent-pair counts as an immutable BigInt histogram anchored by the invariant terminal element, advancing each step in O(R) time over active pairs.',
    complexity: 'O(S · R) time, O(R) space for S steps and R rules',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '1588',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: Part1Visualizer,
};
