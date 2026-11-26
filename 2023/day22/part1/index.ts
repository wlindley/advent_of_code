import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { SandSlabsPart1Visualizer } from './viz/SandSlabsPart1Visualizer';

const EXAMPLE_INPUT = [
  '1,0,1~1,2,1',
  '0,0,2~2,0,2',
  '0,2,3~2,2,3',
  '0,0,4~0,2,4',
  '2,0,5~2,2,5',
  '0,1,6~2,1,6',
  '1,1,8~1,1,9',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2023,
    day: 22,
    part: 1,
    title: 'Sand Slabs',
    puzzleUrl: 'https://adventofcode.com/2023/day/22',
    summary:
      'Settle airborne 3D axis-aligned bricks under gravity and count how many bricks can be removed without causing any upper brick to fall.',
    algorithmSummary:
      'Sort bricks by initial lowest z, drop each onto a flat XY height map to build the support DAG, and count bricks that are never the sole supporter of another brick.',
    complexity: 'O(N log N + sum(area_i)) settling time and O(X * Y + N + E) space',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '5',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: SandSlabsPart1Visualizer,
};
