import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { RainRiskPart1Visualizer } from './viz/RainRiskPart1Visualizer';

const EXAMPLE_INPUT = ['F10', 'N3', 'F7', 'R90', 'F11'].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2020,
    day: 12,
    part: 1,
    title: 'Rain Risk',
    puzzleUrl: 'https://adventofcode.com/2020/day/12',
    summary:
      'Simulate ship navigation instructions starting East from the origin and compute the final Manhattan distance.',
    algorithmSummary:
      'Parse instructions into validated BigInt NavigationInstruction records and step an immutable ShipState under HEADING_NAVIGATION_RULE using 90-degree quarter-turn vector rotations.',
    complexity: 'O(N) time and O(N) parsed input storage across N instructions; O(1) simulation state',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '25',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: RainRiskPart1Visualizer,
};
