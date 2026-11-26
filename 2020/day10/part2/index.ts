import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { AdapterArrayPart2Visualizer } from './viz/AdapterArrayPart2Visualizer';

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
    part: 2,
    title: 'Adapter Array',
    puzzleUrl: 'https://adventofcode.com/2020/day/10#part2',
    summary: 'Count distinct valid adapter arrangements connecting outlet 0 to device max+3 within 3-jolt steps.',
    algorithmSummary:
      'Parse positive integer ratings into a sorted AdapterChain and sum incoming ways from up to three predecessors within 3 jolts using exact BigInt dynamic programming.',
    complexity: 'O(N log N) time for sorting, O(N) DP pass, and O(N) space across N adapters',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '19208',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: AdapterArrayPart2Visualizer,
};
