import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { LinenPart1Visualizer } from './viz/LinenPart1Visualizer';

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
    part: 1,
    title: 'Linen Layout',
    puzzleUrl: 'https://adventofcode.com/2024/day/19',
    summary:
      'Count how many requested multi-stripe towel designs can be assembled by concatenating unlimited copies of the available striped towel patterns.',
    algorithmSummary:
      'Compile available towel patterns into a flat TypedArray 5-way prefix trie and run left-to-right BigInt prefix DP per design with canonical witness reconstruction.',
    complexity: 'O(sum(|p|) + sum(|d| * max|p|)) time and O(sum(|p|) + max|d|) space',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '6',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: LinenPart1Visualizer,
};
