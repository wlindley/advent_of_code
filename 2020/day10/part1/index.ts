import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { AdapterArrayPart1Visualizer } from './viz/AdapterArrayPart1Visualizer';

const EXAMPLE_INPUT = [
  '28', '33', '18', '42', '31', '14', '46', '20',
  '48', '47', '24', '23', '49', '45', '19', '38',
  '39', '11', '1', '32', '25', '35', '8', '17',
  '7', '9', '4', '2', '34', '10', '3',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2020,
    day: 10,
    part: 1,
    title: 'Adapter Array',
    puzzleUrl: 'https://adventofcode.com/2020/day/10',
    summary: 'Sort all joltage adapters from outlet 0 to device max+3 and multiply the 1-jolt and 3-jolt step counts.',
    algorithmSummary:
      'Parse positive integer ratings into a sorted, invariant-checked AdapterChain and accumulate consecutive step deltas into a JoltHistogram under JOLTAGE_DIFF_PRODUCT_POLICY.',
    complexity: 'O(N log N) time for sorting and O(N) space across N adapters',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '220',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: AdapterArrayPart1Visualizer,
};
