import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { TheaterSkylineVisualizer } from './viz/TheaterSkylineVisualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2025,
    day: 9,
    part: 1,
    title: 'Movie Theater',
    puzzleUrl: 'https://adventofcode.com/2025/day/9',
    summary: 'Find the largest inclusive axis-aligned tile rectangle whose opposite corners are two red tiles.',
    algorithmSummary:
      'Extract SW/NE and NW/SE Pareto staircases and run O((|L|+|R|) log |L|) concave-Monge divide-and-conquer over raw BigInt areas.',
    complexity: 'O(N log N) time, O(N) space',
  },
  exampleInput: ['7,1', '11,1', '11,7', '9,7', '9,5', '2,5', '2,3', '7,3'].join('\n'),
  exampleAnswer: '50',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: TheaterSkylineVisualizer,
};
