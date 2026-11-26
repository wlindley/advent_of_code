import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Part1Visualizer } from './viz/Part1Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2021,
    day: 6,
    part: 1,
    title: 'Lanternfish',
    puzzleUrl: 'https://adventofcode.com/2021/day/6',
    summary: 'Compute the total lanternfish population after 80 daily reproduction cycles.',
    algorithmSummary:
      'Group fish into a 9-bucket BigInt timer histogram (0..8) and shift cohorts daily, resetting timer-0 fish to 6 and spawning equal newborns at 8.',
    complexity: 'O(N + D) time, O(1) space where D = 80 days',
  },
  exampleInput: '3,4,3,1,2',
  exampleAnswer: '5934',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: Part1Visualizer,
};
