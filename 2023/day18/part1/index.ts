import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { LagoonPart1Visualizer } from './viz/LagoonPart1Visualizer';

const EXAMPLE_INPUT = [
  'R 6 (#70c710)',
  'D 5 (#0dc571)',
  'L 2 (#5713f0)',
  'D 2 (#d2c081)',
  'R 2 (#59c680)',
  'D 2 (#411b91)',
  'L 5 (#8ceee2)',
  'U 2 (#caa173)',
  'L 1 (#1b58a2)',
  'U 2 (#caa171)',
  'R 2 (#7807d2)',
  'U 3 (#a77fa3)',
  'L 2 (#015232)',
  'U 2 (#7a21e3)',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2023,
    day: 18,
    part: 1,
    title: 'Lavaduct Lagoon',
    puzzleUrl: 'https://adventofcode.com/2023/day/18',
    summary:
      'Compute the total cubic meters of lava held inside an orthogonal trench loop specified by direction, step length, and RGB paint hex.',
    algorithmSummary:
      "Exact arbitrary-precision BigInt Shoelace formula for 2*A combined with Pick's theorem (I = (|2A| - B + 2) / 2, V = I + B).",
    complexity: 'O(N) time and O(N) space over N dig instructions',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '62',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: LagoonPart1Visualizer,
};
