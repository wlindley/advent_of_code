import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { BinaryBoardingPart2Visualizer } from './viz/BinaryBoardingPart2Visualizer';

const EXAMPLE_INPUT = [
  'FBFBBFFRRL',
  'FBFBBFFLRR',
  'FBFBBFFRRR',
  'FBFBBFFRLL',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2020,
    day: 5,
    part: 2,
    title: 'Binary Boarding',
    puzzleUrl: 'https://adventofcode.com/2020/day/5#part2',
    summary: 'Locate the unique empty interior seat ID whose immediate neighbors are both occupied.',
    algorithmSummary: 'Decode each pass as a 10-bit binary seat ID, populate a 1024-seat occupancy bitset, and evaluate MISSING_INTERIOR_SEAT_POLICY.',
    complexity: 'O(N) parse & occupancy population, O(C) fixed 1024-seat interior gap scan',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '357',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: BinaryBoardingPart2Visualizer,
};
