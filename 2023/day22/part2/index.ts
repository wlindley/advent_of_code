import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { SandSlabsPart2Visualizer } from './viz/SandSlabsPart2Visualizer';

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
    part: 2,
    title: 'Sand Slabs',
    puzzleUrl: 'https://adventofcode.com/2023/day/22#part2',
    summary:
      'Settle airborne 3D axis-aligned bricks under gravity and sum how many other bricks would fall in the chain reaction caused by disintegrating each brick.',
    algorithmSummary:
      'Sort bricks by initial lowest z, drop each onto a flat XY height map to build the support DAG, and run Kahn-style in-degree BFS from each load-bearing brick to sum cascade falls.',
    complexity: 'O(N log N + sum(area_i) + N * (N + E)) time and O(X * Y + N + E) space',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '7',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: SandSlabsPart2Visualizer,
};
