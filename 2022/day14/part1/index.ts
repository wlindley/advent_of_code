import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { RegolithPart1Visualizer } from './viz/RegolithPart1Visualizer';

const EXAMPLE_INPUT = [
  '498,4 -> 498,6 -> 496,6',
  '503,4 -> 502,4 -> 502,9 -> 494,9',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2022,
    day: 14,
    part: 1,
    title: 'Regolith Reservoir',
    puzzleUrl: 'https://adventofcode.com/2022/day/14',
    summary:
      'Count how many units of sand come to rest on scanned rock structures before sand begins falling endlessly into the abyss.',
    algorithmSummary:
      'Rasterize rock paths onto a cone-clamped 2D integer grid and run stack-resumed DFS from (500, 0), popping one cell on settle until a grain passes maxY.',
    complexity: 'O(H * W) time, O(H * W) space',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '24',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: RegolithPart1Visualizer,
};
