import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { GardenGroupsPart1Visualizer } from './viz/GardenGroupsPart1Visualizer';

const EXAMPLE_INPUT = [
  'RRRRIICCFF',
  'RRRRIICCCF',
  'VVRRRCCFFF',
  'VVRCCCJFFF',
  'VVVVCJJCFE',
  'VVIVCCJJEE',
  'VVIIICJJEE',
  'MIIIIIJJEE',
  'MIIISIJEEE',
  'MMMISSJEEE',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2024,
    day: 12,
    part: 1,
    title: 'Garden Groups',
    puzzleUrl: 'https://adventofcode.com/2024/day/12',
    summary:
      'Partition a grid of plant plots into 4-connected regions and sum each region area multiplied by its exposed orthogonal perimeter.',
    algorithmSummary:
      'Flood-fill 4-connected plant components with reusable Int32Array buffers, then count non-matching 4-neighbors per cell for each region.',
    complexity: 'O(R * C) time, O(R * C) space',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '1930',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: GardenGroupsPart1Visualizer,
};
