import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { RainRiskPart2Visualizer } from './viz/RainRiskPart2Visualizer';

const EXAMPLE_INPUT = ['F10', 'N3', 'F7', 'R90', 'F11'].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2020,
    day: 12,
    part: 2,
    title: 'Rain Risk',
    puzzleUrl: 'https://adventofcode.com/2020/day/12#part2',
    summary:
      'Simulate waypoint-steered ship navigation starting at (0, 0) with relative waypoint (10E, 1N) and compute the final Manhattan distance.',
    algorithmSummary:
      'Parse instructions into validated BigInt NavigationInstruction records and step an immutable ShipState under WAYPOINT_NAVIGATION_RULE using 90-degree quarter-turn waypoint rotations.',
    complexity: 'O(N) time and O(N) parsed input storage across N instructions; O(1) simulation state',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '286',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: RainRiskPart2Visualizer,
};
