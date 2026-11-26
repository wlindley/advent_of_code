import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import {
  KeypadConundrumPart2Visualizer,
  PART2_EXAMPLE_INPUT,
} from './viz/KeypadConundrumPart2Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2024,
    day: 21,
    part: 2,
    title: 'Keypad Conundrum',
    puzzleUrl: 'https://adventofcode.com/2024/day/21#part2',
    summary:
      'Sum the complexities (shortest human press count times numeric code value) of five door codes controlled through a chain of 25 directional robot keypads and one numeric keypad.',
    algorithmSummary:
      'Build a 5x5 bottom-up BigInt DP table over directional keypad transitions for depths 0..25, evaluate gap-safe numeric keypad candidates, and sum shortest lengths times numeric code values.',
    complexity: 'O(D * 25 + sum(|code|)) time and O(D * 25) space for D = 25 directional robots',
  },
  exampleInput: PART2_EXAMPLE_INPUT,
  exampleAnswer: '154115708116294',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: KeypadConundrumPart2Visualizer,
};
