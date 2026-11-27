import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Part1Visualizer } from './viz/Part1Visualizer';

const EXAMPLE_INPUT = [
  '5483143223',
  '2745854711',
  '5264556173',
  '6141336146',
  '6357385478',
  '4167524645',
  '2176841721',
  '6882881134',
  '4846848554',
  '5283751526',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2021,
    day: 11,
    part: 1,
    title: 'Dumbo Octopus',
    puzzleUrl: 'https://adventofcode.com/2021/day/11',
    summary:
      'Simulate 100 energy-increment and 8-neighbor flash-cascade steps across a 2D grid of dumbo octopuses and count all resulting flashes.',
    algorithmSummary:
      'Propagate each step via a flat Uint8Array energy buffer and Int32Array BFS flash queue with single-flash threshold detection under TOTAL_FLASHES_100_POLICY.',
    complexity: 'O(S * R * C) time, O(R * C) typed-array space',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '1656',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: Part1Visualizer,
};
