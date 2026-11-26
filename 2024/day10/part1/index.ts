import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { HoofItPart1Visualizer } from './viz/HoofItPart1Visualizer';

const EXAMPLE_INPUT = [
  '89010123',
  '78121874',
  '87430965',
  '96549874',
  '45678903',
  '32019012',
  '01329801',
  '10456732',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2024,
    day: 10,
    part: 1,
    title: 'Hoof It',
    puzzleUrl: 'https://adventofcode.com/2024/day/10',
    summary:
      'Sum the score of every height-0 trailhead, counting how many distinct height-9 peaks can be reached via strictly +1 orthogonal uphill steps.',
    algorithmSummary:
      'Parse the grid into an immutable TopographicMap and run stamp-deduplicated level-by-level BFS from each 0-cell with reusable TypedArray buffers.',
    complexity: 'O(T * R) time (bounded by R <= 181 cells per trailhead), O(V) space',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '36',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: HoofItPart1Visualizer,
};
