import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { PlutonianPebblesPart1Visualizer } from './viz/PlutonianPebblesPart1Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2024,
    day: 11,
    part: 1,
    title: 'Plutonian Pebbles',
    puzzleUrl: 'https://adventofcode.com/2024/day/11',
    summary:
      'Count how many engraved pebbles remain after 25 synchronous blinks, where each stone either turns 0 into 1, splits even-digit labels in half, or multiplies by 2024.',
    algorithmSummary:
      'Represent the pebble line as a BigInt frequency histogram and advance it synchronously across blinks using memoized single-stone transitions.',
    complexity: 'O(B * U) time and O(U) space, where B is blink count and U is distinct reachable stone labels',
  },
  exampleInput: '125 17',
  exampleAnswer: '55312',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: PlutonianPebblesPart1Visualizer,
};
