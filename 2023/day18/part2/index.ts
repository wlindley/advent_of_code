import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { LagoonPart2Visualizer } from './viz/LagoonPart2Visualizer';

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
    part: 2,
    title: 'Lavaduct Lagoon',
    puzzleUrl: 'https://adventofcode.com/2023/day/18#part2',
    summary:
      'Decode each 6-digit hex color token into a 5-digit hex dig distance and direction code (0=R, 1=D, 2=L, 3=U), then compute the total cubic meters of lava enclosed.',
    algorithmSummary:
      "Arbitrary-precision BigInt hex decoding paired with exact BigInt Shoelace 2*A and Pick's theorem (I = (|2A| - B + 2) / 2, V = I + B).",
    complexity: 'O(N) time and O(N) space over N dig instructions',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '952408144115',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: LagoonPart2Visualizer,
};
