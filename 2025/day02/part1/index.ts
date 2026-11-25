import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { RangeBandVisualizer } from './viz/RangeBandVisualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2025,
    day: 2,
    part: 1,
    title: 'Gift Shop',
    puzzleUrl: 'https://adventofcode.com/2025/day/2',
    summary: 'Scan closed ID ranges and sum all integers formed by repeating a digit sequence twice.',
    algorithmSummary:
      'Clamp each range onto k-digit half-spaces via M = 10^k + 1 and sum matching arithmetic progressions in O(1) per band.',
    complexity: 'O(R * D) time, O(1) space',
  },
  exampleInput:
    '11-22,95-115,998-1012,1188511880-1188511890,222220-222224,1698522-1698528,' +
    '446443-446449,38593856-38593862,565653-565659,824824821-824824827,2121212118-2121212124',
  exampleAnswer: '1227775554',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: RangeBandVisualizer,
};
