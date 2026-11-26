import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { DistressSignalPart1Visualizer } from './viz/DistressSignalPart1Visualizer';

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
    part: 1,
    title: 'Distress Signal',
    puzzleUrl: 'https://adventofcode.com/2022/day/13',
    summary:
      'Parse pairs of nested integer-and-list packets and sum the 1-based indices of pairs whose left packet precedes the right packet.',
    algorithmSummary:
      'Recursive descent parser builds frozen ASTs; zero-allocation comparator compares integers, lists, and virtual single-element promotions in O(N) AST nodes.',
    complexity: 'O(N) time, O(N) space',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '13',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: DistressSignalPart1Visualizer,
};
