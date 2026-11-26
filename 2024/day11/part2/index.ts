import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { PlutonianPebblesPart2Visualizer } from './viz/PlutonianPebblesPart2Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2024,
    day: 11,
    part: 2,
    title: 'Plutonian Pebbles',
    puzzleUrl: 'https://adventofcode.com/2024/day/11#part2',
    summary:
      'Count how many engraved pebbles remain after 75 synchronous blinks under the same zero-to-one, even-digit-split, and 2024-scaling rules.',
    algorithmSummary:
      'Represent the pebble line as a BigInt frequency histogram and advance 75 blinks synchronously using memoized single-stone transitions.',
    complexity:
      'O(B * U) time and O(U) space, where B = 75 blinks and U is distinct reachable stone labels',
  },
  exampleInput: '125 17',
  exampleAnswer: '65601038650482',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: PlutonianPebblesPart2Visualizer,
};
