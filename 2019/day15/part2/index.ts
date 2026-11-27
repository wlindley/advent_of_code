import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Visualizer } from './viz/Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2019,
    day: 15,
    part: 2,
    title: 'Oxygen System',
    puzzleUrl: 'https://adventofcode.com/2019/day/15#part2',
    summary:
      'Map the entire reachable ship compartment with the repair droid, then determine how many minutes it takes for oxygen to diffuse from the oxygen system to every open tile.',
    algorithmSummary:
      'Explore all reachable corridors via iterative DFS with backtracking on the Intcode VM, then run O(V) head-index queue BFS from the oxygen system to compute the maximum shortest-path distance.',
    complexity: 'O(V * I + V) time and O(V) memory for V compartment tiles and I VM steps per probe',
  },
  exampleInput:
    '3,50,1001,50,57,7,1,0,51,53,1001,50,62,15,1,0,52,54,1002,54,6,55,1,55,53,55,1001,55,67,31,1001,0,0,56,4,56,1006,56,0,1001,53,0,51,1001,54,0,52,1105,1,0,0,3,2,0,0,0,0,0,0,0,-1,1,0,-1,1,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,1,0,1,1,0,0,1,2,1,0,0,0,0,0,0,0,0',
  exampleAnswer: '4',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer,
};
