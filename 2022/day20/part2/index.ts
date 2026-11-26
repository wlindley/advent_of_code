import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { GrovePart2Visualizer } from './viz/GrovePart2Visualizer';

const EXAMPLE_INPUT = ['1', '2', '-3', '3', '-2', '0', '4'].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2022,
    day: 20,
    part: 2,
    title: 'Grove Positioning System',
    puzzleUrl: 'https://adventofcode.com/2022/day/20#part2',
    summary:
      'Multiply each input integer by decryption key 811589153, mix ten times in original index order, and sum the 1000th, 2000th, and 3000th values past 0.',
    algorithmSummary:
      'Sqrt-decomposed circular list (O(sqrt(N)) index lookup and relocation) with BigInt modulo (N - 1) step reduction across 10 mixing rounds.',
    complexity: 'O(N * sqrt(N)) time (10 * N moves), O(N) space',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '1623178306',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: GrovePart2Visualizer,
};
