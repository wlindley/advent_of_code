import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { CathodeRayTubePart2Visualizer } from './viz/CathodeRayTubePart2Visualizer';

const EXAMPLE_DELTAS = [
  1, 4, -8, 0, 12, 2, -14, 18, -18, 21, -21, 0, 28, -28, 34, -1, 5, -38, 39, -38,
  -1, 8, -8, 0, 11, -11, 18, -18, 19, 2, -21, 28, -28, 29, 2, 5, 2, 2, -40, 2,
  1, 5, -8, 0, 12, 1, 5, -18, 0, 21, -21, 28, -28, 29, 2, -31, 38, -1, -37, 1,
  -1, 8, -8, 0, 11, -11, 18, -18, 0, 21, -21, 28, -28, 29, 2, -31, 38, 2, -40, 1,
  -1, 8, -8, 0, 11, -11, 18, -18, 19, 2, -21, 28, -28, 29, 2, 5, 2, 2, -40, 2,
  2, 4, 0, 1, 2, -11, 0, 18, -18, 22, 2, -24, 28, -28, 34, -1, 5, -38, 39, 0,
];

const EXAMPLE_INPUT = EXAMPLE_DELTAS.map((delta) => `addx ${delta}`).join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2022,
    day: 10,
    part: 2,
    title: 'Cathode-Ray Tube',
    puzzleUrl: 'https://adventofcode.com/2022/day/10#part2',
    summary:
      'Render the 40x6 CRT raster driven by the 3-pixel sprite around register X and decode the resulting 8 uppercase letters.',
    algorithmSummary:
      'Execute CPU instructions into a per-cycle timeline, rasterize cycles 1..240 into an immutable Uint8Array framebuffer, and decode each 5x6 glyph via a 30-bit integer lookup table.',
    complexity: 'O(C) time, O(C) space',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: 'ELFCLOCK',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: CathodeRayTubePart2Visualizer,
};
