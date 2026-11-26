import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { HillClimbingPart1Visualizer } from './viz/HillClimbingPart1Visualizer';

const EXAMPLE_INPUT = [
  'Sabqponm',
  'abcryxxl',
  'accszExk',
  'acctuvwj',
  'abdefghi',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2022,
    day: 12,
    part: 1,
    title: 'Hill Climbing Algorithm',
    puzzleUrl: 'https://adventofcode.com/2022/day/12',
    summary:
      'Find the fewest orthogonal steps from start S (elevation a) to goal E (elevation z) when each step can climb at most 1 level.',
    algorithmSummary:
      'Run a single reverse BFS from E allowing neighbor-to-current transitions where neighbor height >= current height - 1, then read the shortest distance at S.',
    complexity: 'O(R * C) time, O(R * C) space',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '31',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: HillClimbingPart1Visualizer,
};
