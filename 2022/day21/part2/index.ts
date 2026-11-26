import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { MonkeyMathPart2Visualizer } from './viz/MonkeyMathPart2Visualizer';

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
    part: 2,
    title: 'Monkey Math',
    puzzleUrl: 'https://adventofcode.com/2022/day/21#part2',
    summary:
      'Treat root as an equality constraint and solve for the exact integer yelled by humn so both subtrees produce identical rational values.',
    algorithmSummary:
      'Path-count dispatch: top-down algebraic inversion along the single path to humn, falling back to exact Rational affine linear solving for multi-path DAGs.',
    complexity: 'O(N) time and space for N reachable monkeys',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '301',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: MonkeyMathPart2Visualizer,
};
