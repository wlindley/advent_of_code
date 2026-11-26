import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { DropletPart1Visualizer } from './viz/DropletPart1Visualizer';

const EXAMPLE_INPUT = [
  '2,2,2', '1,2,2', '3,2,2', '2,1,2', '2,3,2', '2,2,1', '2,2,3',
  '2,2,4', '2,2,6', '1,2,5', '3,2,5', '2,1,5', '2,3,5',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2022,
    day: 18,
    part: 1,
    title: 'Boiling Boulders',
    puzzleUrl: 'https://adventofcode.com/2022/day/18',
    summary: 'Compute the total exposed surface area of a 3D lava droplet made of unit voxel cubes.',
    algorithmSummary:
      'Pack unique integer voxel coordinates into a 1-cell-padded Uint8Array grid and count all empty 6-connected neighbor faces across every lava cube.',
    complexity: 'O(N + V) time, O(V) space within bounding grid volume',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '64',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: DropletPart1Visualizer,
};
