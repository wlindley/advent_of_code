import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { HillClimbingPart2Visualizer } from './viz/HillClimbingPart2Visualizer';

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
    part: 2,
    title: 'Hill Climbing Algorithm',
    puzzleUrl: 'https://adventofcode.com/2022/day/12#part2',
    summary:
      'Find the fewest orthogonal steps to reach goal E (elevation z) from any cell at lowest elevation (a or S), climbing at most 1 level per step.',
    algorithmSummary:
      'Run a single reverse BFS from E using neighbor height >= current height - 1, then pick the first visited cell in BFS order whose height is 0.',
    complexity: 'O(R * C) time, O(R * C) space',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '29',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: HillClimbingPart2Visualizer,
};
