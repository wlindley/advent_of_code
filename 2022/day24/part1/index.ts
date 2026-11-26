import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { BasinPart1Visualizer } from './viz/BasinPart1Visualizer';

const EXAMPLE_INPUT = [
  '#.######',
  '#>>.<^<#',
  '#.<..<<#',
  '#>v.><>#',
  '#<^v^^>#',
  '######.#',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2022,
    day: 24,
    part: 1,
    title: 'Blizzard Basin',
    puzzleUrl: 'https://adventofcode.com/2022/day/24',
    summary:
      'Find the fewest minutes required to cross a rectangular valley of wrapping blizzards from the top entrance to the bottom exit.',
    algorithmSummary:
      'O(1) modular blizzard-bitmask lookup with time-layered (phase, cell) BFS over period = lcm(innerHeight, innerWidth).',
    complexity: 'O(P * H * W) time and space where P = lcm(H - 2, W - 2)',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '18',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: BasinPart1Visualizer,
};
