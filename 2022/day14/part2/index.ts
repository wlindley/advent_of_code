import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { RegolithPart2Visualizer } from './viz/RegolithPart2Visualizer';

const EXAMPLE_INPUT = [
  '498,4 -> 498,6 -> 496,6',
  '503,4 -> 502,4 -> 502,9 -> 494,9',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2022,
    day: 14,
    part: 2,
    title: 'Regolith Reservoir',
    puzzleUrl: 'https://adventofcode.com/2022/day/14#part2',
    summary:
      'Count how many units of sand come to rest on scanned rock structures and an infinite bedrock floor at maxY + 2 until the source at (500, 0) is blocked.',
    algorithmSummary:
      'Rasterize rock paths plus a bedrock floor at y = maxY + 2 onto a triangle-wide 2D integer grid [500 - floorY, 500 + floorY] and run stack-resumed DFS from (500, 0) until the source settles.',
    complexity: 'O(H^2) time, O(H^2) space',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '93',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: RegolithPart2Visualizer,
};
