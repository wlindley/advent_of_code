import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Visualizer } from './viz/Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2019,
    day: 14,
    part: 2,
    title: 'Space Stoichiometry',
    puzzleUrl: 'https://adventofcode.com/2019/day/14#part2',
    summary:
      'Determine the maximum integer quantity of FUEL producible from 1 trillion ORE through integer-batch chemical reactions.',
    algorithmSummary:
      'Exponentially bracket a feasible/infeasible FUEL interval using BigInt stoichiometry evaluations, then binary-search for the exact maximum FUEL within the 1 trillion ORE budget.',
    complexity: 'O((V + E) log F) time and O(V + E) space for V chemicals, E dependencies, and max fuel F',
  },
  exampleInput: [
    '157 ORE => 5 NZVS',
    '165 ORE => 6 DCFZ',
    '44 XJWVT, 5 KHKGT, 1 QDVJ, 29 NZVS, 9 GPVTF, 48 HKGWZ => 1 FUEL',
    '12 HKGWZ, 1 GPVTF, 8 PSHF => 9 QDVJ',
    '179 ORE => 7 PSHF',
    '177 ORE => 5 HKGWZ',
    '7 DCFZ, 7 PSHF => 2 XJWVT',
    '165 ORE => 2 GPVTF',
    '3 DCFZ, 7 NZVS, 5 HKGWZ, 10 PSHF => 8 KHKGT',
  ].join('\n'),
  exampleAnswer: '82892753',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer,
};
