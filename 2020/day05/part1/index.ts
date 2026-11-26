import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { BinaryBoardingPart1Visualizer } from './viz/BinaryBoardingPart1Visualizer';

const EXAMPLE_INPUT = [
  'FBFBBFFRLR',
  'BFFFBBFRRR',
  'FFFBBBFRRR',
  'BBFFBBFRLL',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2020,
    day: 5,
    part: 1,
    title: 'Binary Boarding',
    puzzleUrl: 'https://adventofcode.com/2020/day/5',
    summary: 'Decode 10-character F/B/L/R boarding passes into seat IDs and report the highest occupied seat ID.',
    algorithmSummary: 'Decode each pass as a 10-bit binary seat ID, populate a 1024-seat occupancy bitset, and evaluate HIGHEST_SEAT_POLICY.',
    complexity: 'O(N) parse & occupancy population, O(C) fixed 1024-seat scan',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '820',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: BinaryBoardingPart1Visualizer,
};
