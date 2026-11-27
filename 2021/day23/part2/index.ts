import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Part2Visualizer } from './viz/Part2Visualizer';

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
    part: 2,
    title: 'Amphipod',
    puzzleUrl: 'https://adventofcode.com/2021/day/23#part2',
    summary:
      'Unfold each side room to depth 4 and organize all 16 amphipods of species A-D into their respective rooms using minimum total movement energy.',
    algorithmSummary:
      'Prepare depth-4 burrow states via UnfoldedBurrowPolicy, prune to forced home-entry moves when available, and run A* search with an admissible triangular-entry lower bound.',
    complexity: 'O(E log V) A* expansions over reachable pruned depth-4 burrow states',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '44169',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: Part2Visualizer,
};
