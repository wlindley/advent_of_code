import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { FactoryPart1Visualizer } from './viz/FactoryPart1Visualizer';

const EXAMPLE_INPUT = [
  'Blueprint 1: Each ore robot costs 4 ore. Each clay robot costs 2 ore. Each obsidian robot costs 3 ore and 14 clay. Each geode robot costs 2 ore and 7 obsidian.',
  'Blueprint 2: Each ore robot costs 2 ore. Each clay robot costs 3 ore. Each obsidian robot costs 3 ore and 8 clay. Each geode robot costs 3 ore and 12 obsidian.',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2022,
    day: 19,
    part: 1,
    title: 'Not Enough Minerals',
    puzzleUrl: 'https://adventofcode.com/2022/day/19',
    summary: 'Maximize geode output per robot blueprint over 24 minutes and sum all blueprint quality levels.',
    algorithmSummary:
      'Jump-to-next-robot-build branch-and-bound DFS with robot-rate caps, surplus stock pruning, triangular upper bound, and a 3-tier decoupled relaxation bound.',
    complexity: 'Branch-and-bound DFS per blueprint over 24 minutes; O(N * T) trace replay',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '33',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: FactoryPart1Visualizer,
};
