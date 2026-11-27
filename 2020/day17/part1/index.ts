import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { ConwayPart1Visualizer } from './viz/ConwayPart1Visualizer';

const EXAMPLE_INPUT = '.#.\n..#\n###';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2020,
    day: 17,
    part: 1,
    title: 'Conway Cubes',
    puzzleUrl: 'https://adventofcode.com/2020/day/17',
    summary:
      'Simulate six boot cycles of a 3D infinite cellular automaton from a flat initial slice and count active cubes.',
    algorithmSummary:
      'Run three separable 1D 3-tap box-sum passes over ping-pong Uint8Array lattices within a strictly bounded envelope B_t.',
    complexity: 'O(C * (W + 2C)(H + 2C)(1 + 2C)) time and space',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '112',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: ConwayPart1Visualizer,
};
