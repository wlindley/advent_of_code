import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { DropletPart2Visualizer } from './viz/DropletPart2Visualizer';

const EXAMPLE_INPUT = [
  '2,2,2', '1,2,2', '3,2,2', '2,1,2', '2,3,2', '2,2,1', '2,2,3',
  '2,2,4', '2,2,6', '1,2,5', '3,2,5', '2,1,5', '2,3,5',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2022,
    day: 18,
    part: 2,
    title: 'Boiling Boulders',
    puzzleUrl: 'https://adventofcode.com/2022/day/18#part2',
    summary: 'Compute the exterior-reachable surface area of a 3D lava droplet, excluding sealed interior air pockets.',
    algorithmSummary:
      'Run a 6-connected BFS flood fill from the 1-voxel-padded bounding box corner over empty cells and count lava faces adjacent to reached exterior air.',
    complexity: 'O(N + V) time, O(V) space within padded bounding grid volume',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '58',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: DropletPart2Visualizer,
};
