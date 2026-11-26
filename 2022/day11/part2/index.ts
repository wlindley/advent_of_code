import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { MonkeyInTheMiddlePart2Visualizer } from './viz/MonkeyInTheMiddlePart2Visualizer';

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
    part: 2,
    title: 'Monkey in the Middle',
    puzzleUrl: 'https://adventofcode.com/2022/day/11#part2',
    summary:
      'Simulate 10,000 rounds of monkey Keep Away with modular worry reduction and multiply the top two inspection counts.',
    algorithmSummary:
      'Bound worry growth by reducing each inspected item modulo the LCM of all monkey test divisors, preserving every divisibility outcome across 10,000 rounds of independent item trajectories.',
    complexity: 'O(R * N) time, O(M + N) space',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '2713310158',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: MonkeyInTheMiddlePart2Visualizer,
};
