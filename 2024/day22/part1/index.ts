import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import {
  MonkeyMarketPart1Visualizer,
  PART1_EXAMPLE_INPUT,
} from './viz/MonkeyMarketPart1Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2024,
    day: 22,
    part: 1,
    title: 'Monkey Market',
    puzzleUrl: 'https://adventofcode.com/2024/day/22',
    summary:
      'Simulate 2,000 steps of a 24-bit xorshift-like secret PRNG for each buyer and sum their 2000th secret numbers.',
    algorithmSummary:
      'Advance each buyer seed 2,000 times using bitwise 24-bit mix-and-prune steps (<< 6, >>> 5, << 11 masked by 0xFFFFFF) and sum the final secrets in BigInt.',
    complexity: 'O(B * S) time and O(B) space for B buyers and S = 2,000 steps',
  },
  exampleInput: PART1_EXAMPLE_INPUT,
  exampleAnswer: '37327623',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: MonkeyMarketPart1Visualizer,
};
