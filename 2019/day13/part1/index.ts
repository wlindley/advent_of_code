import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Visualizer } from './viz/Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2019,
    day: 13,
    part: 1,
    title: 'Care Package',
    puzzleUrl: 'https://adventofcode.com/2019/day/13',
    summary:
      'Run the Intcode arcade cabinet program, apply all emitted (x, y, tileId) triples onto the screen grid, and count remaining block tiles.',
    algorithmSummary:
      'Execute the complete sparse-memory Intcode VM with an O(1) cursor-draining I/O channel, decode (x, y, tileId) triples into a coordinate map, and count tiles with id === 2 after halting.',
    complexity: 'O(V + D) time and O(T) memory for V VM steps, D output triples, and T distinct screen coordinates',
  },
  exampleInput: '104,1,104,2,104,3,104,6,104,5,104,4,99',
  exampleAnswer: '0',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer,
};
