import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Part2Visualizer } from './viz/Part2Visualizer';

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
    part: 2,
    title: 'Extended Polymerization',
    puzzleUrl: 'https://adventofcode.com/2021/day/14#part2',
    summary:
      'Simulate 40 synchronous pair-insertion rounds from an initial polymer template and compute the BigInt difference between the highest and lowest element frequencies.',
    algorithmSummary:
      'Track adjacent-pair counts as an immutable BigInt histogram anchored by the invariant terminal element, advancing each step in O(R) time over active pairs.',
    complexity: 'O(S · R) time, O(R) space for S steps and R rules',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '2188189693529',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: Part2Visualizer,
};
