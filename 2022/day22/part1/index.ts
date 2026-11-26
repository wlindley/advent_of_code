import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { MonkeyMapPart1Visualizer } from './viz/MonkeyMapPart1Visualizer';

const EXAMPLE_INPUT = [
  '        ...#',
  '        .#..',
  '        #...',
  '        ....',
  '...#.......#',
  '........#...',
  '..#....#....',
  '..........#.',
  '        ...#....',
  '        .....#..',
  '        .#......',
  '        ......#.',
  '',
  '10R5L5R10L4R5L5',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2022,
    day: 22,
    part: 1,
    title: 'Monkey Map',
    puzzleUrl: 'https://adventofcode.com/2022/day/22',
    summary:
      'Trace a sequence of forward moves and 90-degree turns across an irregular grid with flat-torus edge wrapping to compute the final password.',
    algorithmSummary:
      'Step cell-by-cell under FlatTorusTopology, scanning backward across the active row or column span on void crossings and halting before walls.',
    complexity: 'O(D) time for D total stepped tiles; O(H*W + P) space',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '6032',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: MonkeyMapPart1Visualizer,
};
