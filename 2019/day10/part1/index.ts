import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Visualizer } from './viz/Visualizer';

const EXAMPLE_INPUT = ['.#..#', '.....', '#####', '....#', '...##'].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2019,
    day: 10,
    part: 1,
    title: 'Monitoring Station',
    puzzleUrl: 'https://adventofcode.com/2019/day/10',
    summary:
      'Locate the asteroid whose line-of-sight visibility reaches the largest number of other asteroids in the field.',
    algorithmSummary:
      'Normalize row-major asteroid displacements by gcd(dx, dy), stamp unique half-plane rays per origin in a Uint32Array to tally symmetric visibility counts, and pick the earliest row-major maximum.',
    complexity: 'O(A^2 log(W + H)) time for A asteroids on a WxH grid, O(W * H + A) space',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '8',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer,
};
