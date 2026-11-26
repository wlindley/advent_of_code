import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { GardenGroupsPart2Visualizer } from './viz/GardenGroupsPart2Visualizer';

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
    part: 2,
    title: 'Garden Groups',
    puzzleUrl: 'https://adventofcode.com/2024/day/12#part2',
    summary:
      'Partition a grid of plant plots into 4-connected regions and sum each region area multiplied by its number of straight fence sides.',
    algorithmSummary:
      'Flood-fill 4-connected plant components with reusable Int32Array buffers, then count convex and concave corners per cell for each region (corners equal straight sides).',
    complexity: 'O(R * C) time, O(R * C) space',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '1206',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: GardenGroupsPart2Visualizer,
};
