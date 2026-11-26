import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { GrovePart1Visualizer } from './viz/GrovePart1Visualizer';

const EXAMPLE_INPUT = ['1', '2', '-3', '3', '-2', '0', '4'].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2022,
    day: 20,
    part: 1,
    title: 'Grove Positioning System',
    puzzleUrl: 'https://adventofcode.com/2022/day/20',
    summary:
      'Relocate every signed integer once in original order around a circular buffer and sum the values 1000, 2000, and 3000 slots past 0.',
    algorithmSummary:
      'Sqrt-decomposed circular list (O(sqrt(N)) index lookup and relocation) with Euclidean BigInt modulo (N - 1) step reduction.',
    complexity: 'O(N * sqrt(N)) time, O(N) space for one mixing round',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '3',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: GrovePart1Visualizer,
};
