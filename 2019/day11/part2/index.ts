import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Visualizer } from './viz/Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2019,
    day: 11,
    part: 2,
    title: 'Space Police',
    puzzleUrl: 'https://adventofcode.com/2019/day/11#part2',
    summary:
      'Simulate an emergency hull-painting Intcode robot starting on a single white panel and decode the painted 5x6 registration identifier.',
    algorithmSummary:
      'Run the sparse-memory Intcode camera feedback loop with startPanelColor = 1, collect final white hull coordinates, and match 30-bit 5x6 Space Image glyph masks with minX / minX - 1 origin alignment.',
    complexity: 'O(V + S) time and O(P) memory for V VM steps, S robot steps, and P distinct painted panels',
  },
  exampleInput:
    '3,26,1006,26,25,109,27,204,0,204,1,109,2,1207,0,0,26,1005,26,25,3,26,1105,1,7,99,0,0,1,1,1,1,0,0,0,0,1,0,1,0,0,1,0,1,1,0,1,0,0,0,0,1,1,1,1,1,0,0,0,1,1,0,1,0,0,0,1,0,1,0,0,0,1,0,1,0,0,1,0,1,1,0,1,0,0,0,0,0,1,1,1,1,0,1,0,0,1,0,1,1,0,1,0,1,1,0,0,0,0,1,1,1,0,0,0,0,1,0,1,0,0,1,0,1,1,0,1,0,0,1,0,0,1,1,1,1,0,1,0,0,1,0,1,0,0,-1',
  exampleAnswer: 'HI',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer,
};
