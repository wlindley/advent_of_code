import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Part1Visualizer } from './viz/Part1Visualizer';

const EXAMPLE_INPUT = [
  'start-A',
  'start-b',
  'A-c',
  'A-b',
  'b-d',
  'A-end',
  'b-end',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2021,
    day: 12,
    part: 1,
    title: 'Passage Pathing',
    puzzleUrl: 'https://adventofcode.com/2021/day/12',
    summary:
      'Count all distinct paths from start to end through an undirected cave network where lowercase caves may be visited at most once and uppercase caves arbitrarily often.',
    algorithmSummary:
      'Contract uppercase caves into weighted transitions among start, lowercase caves, and end, then count paths via BigInt bitmask memoization under NO_REVISIT_POLICY.',
    complexity: 'O(V^2 + K^2 * 2^K) time, O(K * 2^K) memo space',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '10',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: Part1Visualizer,
};
