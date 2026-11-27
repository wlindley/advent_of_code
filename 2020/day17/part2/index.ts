import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { ConwayPart2Visualizer } from './viz/ConwayPart2Visualizer';

const EXAMPLE_INPUT = '.#.\n..#\n###';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2020,
    day: 17,
    part: 2,
    title: 'Conway Cubes',
    puzzleUrl: 'https://adventofcode.com/2020/day/17#part2',
    summary:
      'Simulate six boot cycles of a 4D hypercube Conway automaton seeded at z = 0, w = 0 and count active hypercubes.',
    algorithmSummary:
      'Run four separable 1D 3-tap box-sum passes over ping-pong Uint8Array 4D lattices within a strictly bounded envelope B_t.',
    complexity: 'O(C * (W + 2C)(H + 2C)(1 + 2C)^2) time and space',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '848',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: ConwayPart2Visualizer,
};
