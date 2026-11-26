import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { ChronospatialPart2Visualizer } from './viz/ChronospatialPart2Visualizer';

const EXAMPLE_INPUT = [
  'Register A: 2024',
  'Register B: 0',
  'Register C: 0',
  '',
  'Program: 0,3,5,4,3,0',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2024,
    day: 17,
    part: 2,
    title: 'Chronospatial Computer',
    puzzleUrl: 'https://adventofcode.com/2024/day/17#part2',
    summary:
      'Find the lowest positive initial Register A value that causes the 3-bit Chronospatial virtual machine to output an exact copy of its own program instructions.',
    algorithmSummary:
      'Backward octal-digit DFS from the final program token to index 0, testing 3-bit extensions in ascending order with backtracking and a bounded candidate cap.',
    complexity: 'O(N * S) typical across N program tokens and S VM steps per candidate, bounded by maxCandidates',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '117440',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: ChronospatialPart2Visualizer,
};
