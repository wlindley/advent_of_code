import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { LinenPart2Visualizer } from './viz/LinenPart2Visualizer';

const EXAMPLE_INPUT = [
  'r, wr, b, g, bwu, rb, gb, br',
  '',
  'brwrr',
  'bggr',
  'gbbr',
  'rrbgbr',
  'ubwu',
  'bwurrg',
  'brgr',
  'bbrgwb',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2024,
    day: 19,
    part: 2,
    title: 'Linen Layout',
    puzzleUrl: 'https://adventofcode.com/2024/day/19#part2',
    summary:
      'Sum the exact total number of distinct ways each requested striped towel design can be assembled from unlimited copies of the available towel patterns.',
    algorithmSummary:
      'Compile available towel patterns into a flat TypedArray 5-way prefix trie and sum exact left-to-right BigInt prefix DP counts across all designs.',
    complexity: 'O(sum(|p|) + sum(|d| * max|p|)) time and O(sum(|p|) + max|d|) space',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '16',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: LinenPart2Visualizer,
};
