import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Visualizer } from './viz/Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2023,
    day: 8,
    part: 1,
    title: 'Haunted Wasteland',
    puzzleUrl: 'https://adventofcode.com/2023/day/8',
    summary:
      'Traverse a directed left/right node network from AAA to ZZZ by repeatedly cycling through a sequence of L/R turn instructions, and report the total step count.',
    algorithmSummary:
      'Encode turns into Uint8Array and node transitions into Int32Array indices, then step from AAA with modular tape wrap-around and Uint8Array(V * L) cycle detection until reaching ZZZ.',
    complexity: 'O(V * L) worst-case time and space, O(steps) typical walk time',
  },
  exampleInput: [
    'LLR',
    '',
    'AAA = (BBB, BBB)',
    'BBB = (AAA, ZZZ)',
    'ZZZ = (ZZZ, ZZZ)',
  ].join('\n'),
  exampleAnswer: '6',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer,
};
