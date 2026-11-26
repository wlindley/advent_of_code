import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { DistressSignalPart2Visualizer } from './viz/DistressSignalPart2Visualizer';

const EXAMPLE_INPUT = [
  '[1,1,3,1,1]',
  '[1,1,5,1,1]',
  '',
  '[[1],[2,3,4]]',
  '[[1],4]',
  '',
  '[9]',
  '[[8,7,6]]',
  '',
  '[[4,4],4,4]',
  '[[4,4],4,4,4]',
  '',
  '[7,7,7,7]',
  '[7,7,7]',
  '',
  '[]',
  '[3]',
  '',
  '[[[]]]',
  '[[]]',
  '',
  '[1,[2,[3,[4,[5,6,7]]]],8,9]',
  '[1,[2,[3,[4,[5,6,0]]]],8,9]',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2022,
    day: 13,
    part: 2,
    title: 'Distress Signal',
    puzzleUrl: 'https://adventofcode.com/2022/day/13#part2',
    summary:
      'Insert divider packets [[2]] and [[6]], sort all packets, and multiply the 1-based positions of the two dividers.',
    algorithmSummary:
      'Single-pass O(N) divider partition counts packets before [[2]] and between [[2]] and [[6]] without materializing a full O(N log N) sort.',
    complexity: 'O(N) time, O(N) space',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '140',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: DistressSignalPart2Visualizer,
};
