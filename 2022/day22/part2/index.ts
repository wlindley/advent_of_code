import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { MonkeyMapPart2Visualizer } from './viz/MonkeyMapPart2Visualizer';

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
    part: 2,
    title: 'Monkey Map',
    puzzleUrl: 'https://adventofcode.com/2022/day/22#part2',
    summary:
      'Fold the irregular 2D board net into a 3D cube and trace forward moves and 90-degree turns across rotated cube seams to compute the final password.',
    algorithmSummary:
      'Fold the 6 square net faces via BFS in 3D orientation frames (CubeNetTopology), step cell-by-cell with orthonormal seam coordinate/facing reorientation, and halt before walls.',
    complexity: 'O(D + H*W) time for D stepped tiles on an HxW board; O(H*W + P) space',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '5031',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: MonkeyMapPart2Visualizer,
};
