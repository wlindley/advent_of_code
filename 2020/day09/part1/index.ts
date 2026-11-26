import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { EncodingErrorPart1Visualizer } from './viz/EncodingErrorPart1Visualizer';

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
    part: 1,
    title: 'Encoding Error',
    puzzleUrl: 'https://adventofcode.com/2020/day/9',
    summary: 'Find the first post-preamble integer that is not the sum of two distinct values in the prior 25 numbers.',
    algorithmSummary:
      'Parse positive BigInts into an XmasStream, slide a 25-element last-index Map under FIRST_INVALID_POLICY, and return the first target lacking a distinct-value complement.',
    complexity: 'O(N * W) time and O(N + W) space over stream length N and preamble width W = 25',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '125',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: EncodingErrorPart1Visualizer,
};
