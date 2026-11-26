import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { BasinPart2Visualizer } from './viz/BasinPart2Visualizer';

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
    part: 2,
    title: 'Blizzard Basin',
    puzzleUrl: 'https://adventofcode.com/2022/day/24#part2',
    summary:
      'Find the fewest minutes required to cross from the entrance to the exit, return to the entrance, and cross to the exit again.',
    algorithmSummary:
      'Sequential 3-leg (phase, cell) BFS across S → E → S → E with O(1) modular blizzard-bitmask lookup over period = lcm(innerHeight, innerWidth).',
    complexity: 'O(P * H * W) time and space where P = lcm(H - 2, W - 2)',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '54',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: BasinPart2Visualizer,
};
