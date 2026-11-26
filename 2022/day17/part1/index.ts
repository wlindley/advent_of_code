import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { PyroclasticPart1Visualizer } from './viz/PyroclasticPart1Visualizer';

const EXAMPLE_INPUT = '>>><<><>><<<>><>>><<<>>><<<><<<>><>><<>>';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2022,
    day: 17,
    part: 1,
    title: 'Pyroclastic Flow',
    puzzleUrl: 'https://adventofcode.com/2022/day/17',
    summary: 'Simulate 2,022 falling Tetris-style rocks pushed by a repeating jet stream in a 7-unit chamber.',
    algorithmSummary:
      'Represent each chamber row as a 7-bit mask and rocks as 4-byte packed masks; detect repeating (rock, jet, reachable-cavity) states to fast-forward full cycles in BigInt.',
    complexity: 'O(cycleStart + cycleLen) simulation + BigInt O(1) cycle skip',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '3068',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: PyroclasticPart1Visualizer,
};
