import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { MonkeyMathPart1Visualizer } from './viz/MonkeyMathPart1Visualizer';

const EXAMPLE_INPUT = [
  'root: pppw + sjmn',
  'dbpl: 5',
  'cczh: sllz + lgvd',
  'zczc: 2',
  'ptdq: humn - dvpt',
  'dvpt: 3',
  'lfqf: 4',
  'humn: 5',
  'ljgn: 2',
  'sjmn: drzm * dbpl',
  'sllz: 4',
  'pppw: cczh / lfqf',
  'lgvd: ljgn * ptdq',
  'drzm: hmdt - zczc',
  'hmdt: 32',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2022,
    day: 21,
    part: 1,
    title: 'Monkey Math',
    puzzleUrl: 'https://adventofcode.com/2022/day/21',
    summary:
      'Evaluate a directed acyclic graph of monkeys yelling integer literals or binary arithmetic expressions to find the number yelled by root.',
    algorithmSummary:
      'Bottom-up evaluation in topological order over the reachable subgraph from root using exact arbitrary-precision Rational arithmetic.',
    complexity: 'O(N) time and space for N reachable monkeys',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '152',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: MonkeyMathPart1Visualizer,
};
