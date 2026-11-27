import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Part2Visualizer } from './viz/Part2Visualizer';

const EXAMPLE_1 = [
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
    part: 2,
    title: 'Passage Pathing',
    puzzleUrl: 'https://adventofcode.com/2021/day/12#part2',
    summary:
      'Count all distinct paths from start to end through an undirected cave network where at most one regular lowercase cave may be visited twice and all other lowercase caves at most once.',
    algorithmSummary:
      'Contract uppercase caves into weighted transitions among start, lowercase caves, and end, then count paths via BigInt bitmask and revisit-budget memoization under SINGLE_SMALL_REVISIT_POLICY.',
    complexity: 'O(V^2 + K^2 * 2^K) time, O(K * 2^K) memo space',
  },
  exampleInput: EXAMPLE_1,
  exampleAnswer: '36',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: Part2Visualizer,
};
