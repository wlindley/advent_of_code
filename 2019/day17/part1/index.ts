import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Visualizer } from './viz/Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2019,
    day: 17,
    part: 1,
    title: 'Set and Forget',
    puzzleUrl: 'https://adventofcode.com/2019/day/17',
    summary:
      'Run the ASCII-capable Intcode camera feed to decode the exterior scaffold grid, locate every four-way intersection, and sum their alignment parameters.',
    algorithmSummary:
      'Execute the unmodified Intcode VM with an O(1) cursor-draining ASCII output channel, pack the 2D grid into a compact Uint8Array, and sum x * y across all interior 4-neighbor scaffold crossings.',
    complexity: 'O(I + W * H) time and O(W * H) memory for I VM steps and W x H ASCII grid',
  },
  exampleInput:
    '4,15,1001,1,1,1,1008,1,113,14,1006,14,0,99,0,46,46,35,46,46,46,46,46,46,46,46,46,46,10,46,46,35,46,46,46,46,46,46,46,46,46,46,10,35,35,35,35,35,35,35,46,46,46,35,35,35,10,35,46,35,46,46,46,35,46,46,46,35,46,35,10,35,35,35,35,35,35,35,35,35,35,35,35,35,10,46,46,35,46,46,46,35,46,46,46,35,46,46,10,46,46,35,35,35,35,35,46,46,46,94,46,46,10',
  exampleAnswer: '76',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer,
};
