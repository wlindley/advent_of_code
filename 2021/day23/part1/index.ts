import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Part1Visualizer } from './viz/Part1Visualizer';

const EXAMPLE_INPUT = [
  '#############',
  '#...........#',
  '###B#C#B#D###',
  '  #A#D#C#A#',
  '  #########',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2021,
    day: 23,
    part: 1,
    title: 'Amphipod',
    puzzleUrl: 'https://adventofcode.com/2021/day/23',
    summary:
      'Organize amphipods of species A-D into their respective depth-2 side rooms using minimum total movement energy.',
    algorithmSummary:
      'Encode burrow states as compact strings under StandardBurrowPolicy, prune to forced home-entry transitions when available, and run A* search with an admissible triangular-entry lower bound.',
    complexity: 'O(E log V) A* expansions over reachable pruned burrow states',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '12521',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: Part1Visualizer,
};
