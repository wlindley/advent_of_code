import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { SupplyStacksVisualizer } from './viz/SupplyStacksVisualizer';

const EXAMPLE_INPUT = [
  '    [D]    ',
  '[N] [C]    ',
  '[Z] [M] [P]',
  ' 1   2   3 ',
  '',
  'move 1 from 2 to 1',
  'move 3 from 1 to 3',
  'move 2 from 2 to 1',
  'move 1 from 1 to 2',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2022,
    day: 5,
    part: 1,
    title: 'Supply Stacks',
    puzzleUrl: 'https://adventofcode.com/2022/day/5',
    summary: 'Simulate one-at-a-time LIFO crate moves across stacks and read the top crate label of each stack.',
    algorithmSummary:
      'Parse leading-space-significant stacks bottom-to-top, then execute each move with CrateMover 9000 by slicing the top k crates and pushing them in reversed order.',
    complexity: 'O(N + sum(count)) time, O(N) space',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: 'CMZ',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: SupplyStacksVisualizer,
};
