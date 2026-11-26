import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { EncodingErrorPart2Visualizer } from './viz/EncodingErrorPart2Visualizer';

const EXAMPLE_INPUT = [
  ...Array.from({ length: 25 }, (_, i) => String(i + 1)),
  '45',
  '26',
  '64',
  '66',
  '125',
  '111',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2020,
    day: 9,
    part: 2,
    title: 'Encoding Error',
    puzzleUrl: 'https://adventofcode.com/2020/day/9#part2',
    summary: 'Find the contiguous range (>= 2 numbers) summing to the first invalid post-preamble value and sum its min and max.',
    algorithmSummary:
      'Locate the first invalid BigInt via sliding 25-value preamble checks under ENCRYPTION_WEAKNESS_POLICY, then slide a two-pointer positive-sum window to find the matching contiguous range and return min + max.',
    complexity: 'O(N * W) time and O(N + W) space over stream length N and preamble width W = 25',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '25',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: EncodingErrorPart2Visualizer,
};
