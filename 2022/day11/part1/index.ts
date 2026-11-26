import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { MonkeyInTheMiddlePart1Visualizer } from './viz/MonkeyInTheMiddlePart1Visualizer';

const EXAMPLE_INPUT = [
  'Monkey 0:',
  '  Starting items: 79, 98',
  '  Operation: new = old * 19',
  '  Test: divisible by 23',
  '    If true: throw to monkey 2',
  '    If false: throw to monkey 3',
  '',
  'Monkey 1:',
  '  Starting items: 54, 65, 75, 74',
  '  Operation: new = old + 6',
  '  Test: divisible by 19',
  '    If true: throw to monkey 2',
  '    If false: throw to monkey 0',
  '',
  'Monkey 2:',
  '  Starting items: 79, 60, 97',
  '  Operation: new = old * old',
  '  Test: divisible by 13',
  '    If true: throw to monkey 1',
  '    If false: throw to monkey 3',
  '',
  'Monkey 3:',
  '  Starting items: 74',
  '  Operation: new = old + 3',
  '  Test: divisible by 17',
  '    If true: throw to monkey 0',
  '    If false: throw to monkey 1',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2022,
    day: 11,
    part: 1,
    title: 'Monkey in the Middle',
    puzzleUrl: 'https://adventofcode.com/2022/day/11',
    summary:
      'Simulate 20 rounds of monkey Keep Away with floor(worry / 3) relief and multiply the top two inspection counts.',
    algorithmSummary:
      'Parse each monkey rule into an immutable specification and trace each item independently across 20 rounds, advancing the round counter whenever an item is thrown to a lower-indexed monkey.',
    complexity: 'O(R * N) time, O(M + N) space',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '10605',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: MonkeyInTheMiddlePart1Visualizer,
};
