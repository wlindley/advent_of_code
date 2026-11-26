import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { HoofItPart2Visualizer } from './viz/HoofItPart2Visualizer';

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
    part: 2,
    title: 'Hoof It',
    puzzleUrl: 'https://adventofcode.com/2024/day/10#part2',
    summary:
      'Sum the rating of every height-0 trailhead, counting all distinct hiking trails ascending via strictly +1 orthogonal steps to any height-9 peak.',
    algorithmSummary:
      'Parse the grid into an immutable TopographicMap and propagate path multiplicities level-by-level from each 0-cell with reusable TypedArray buffers.',
    complexity: 'O(T * R) time (bounded by R <= 181 cells per trailhead), O(V) space',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '81',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: HoofItPart2Visualizer,
};
