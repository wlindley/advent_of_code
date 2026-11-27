import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Visualizer } from './viz/Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2019,
    day: 14,
    part: 1,
    title: 'Space Stoichiometry',
    puzzleUrl: 'https://adventofcode.com/2019/day/14',
    summary:
      'Determine the minimum quantity of ORE required to synthesize exactly 1 unit of FUEL through integer-batch chemical reactions.',
    algorithmSummary:
      'Validate the reaction network as a DAG, prune unreachable reactions via FUEL-to-ORE relevant subgraph extraction, and accumulate exact integer ceiling-divided reaction batches in top-down topological demand order.',
    complexity: 'O(V + E) time and O(V + E) space for V chemicals and E reaction dependencies',
  },
  exampleInput: [
    '10 ORE => 10 A',
    '1 ORE => 1 B',
    '7 A, 1 B => 1 C',
    '7 A, 1 C => 1 D',
    '7 A, 1 D => 1 E',
    '7 A, 1 E => 1 FUEL',
  ].join('\n'),
  exampleAnswer: '31',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer,
};
