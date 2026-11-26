import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { FactoryLightsVisualizer } from './viz/FactoryLightsVisualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2025,
    day: 10,
    part: 1,
    title: 'Factory',
    puzzleUrl: 'https://adventofcode.com/2025/day/10',
    summary: 'Find the minimum total button presses across all factory machines to match each target indicator pattern.',
    algorithmSummary:
      'Model each machine as a GF(2) linear system A x = target, reduce to full RREF, and Gray-code search the nullspace for the minimum-Hamming-weight solution.',
    complexity: 'O(L * B + 2^nullity) per machine',
  },
  exampleInput: [
    '[.##.] (3) (1,3) (2) (2,3) (0,2) (0,1) {3,5,4,7}',
    '[...#.] (0,2,3,4) (2,3) (0,4) (0,1,2) (1,2,3,4) {7,5,12,7,2}',
    '[.###.#] (0,1,2,3,4) (0,3,4) (0,1,2,4,5) (1,2) {10,11,11,5,10,5}',
  ].join('\n'),
  exampleAnswer: '7',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: FactoryLightsVisualizer,
};
