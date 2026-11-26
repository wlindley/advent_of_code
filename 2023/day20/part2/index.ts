import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { PulsePart2Visualizer } from './viz/PulsePart2Visualizer';

// Synthetic 2-counter (periods 5 and 7 -> LCM 35) example for interactive Part 2 visualization.
const EXAMPLE_INPUT = [
  'broadcaster -> aa, ba',
  '%aa -> ab, ca',
  '%ab -> ac',
  '%ac -> ca',
  '&ca -> aa, ab, inva',
  '&inva -> agg',
  '%ba -> bb, cb',
  '%bb -> bc, cb',
  '%bc -> cb',
  '&cb -> ba, invb',
  '&invb -> agg',
  '&agg -> rx',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2023,
    day: 20,
    part: 2,
    title: 'Pulse Propagation',
    puzzleUrl: 'https://adventofcode.com/2023/day/20#part2',
    summary:
      'Find the fewest button presses required to deliver a single low pulse to module rx.',
    algorithmSummary:
      'Detects the conjunction feeder into rx, records first and second zero-phase high-pulse presses for each feeder input, and folds their periods via lcmBigInt.',
    complexity: 'O(P_max * (V + E)) time and O(V + E) space where P_max is the largest feeder cycle period',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '35',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: PulsePart2Visualizer,
};
