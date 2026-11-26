import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Part2Visualizer } from './viz/Part2Visualizer';

const EXAMPLE_INPUT = [
  '[({(<(())[]>[[{[]{<()<>>',
  '[(()[<>])]({[<{<<[]>>(',
  '{([(<{}[<>[]}>{[]{[(<()>',
  '(((({<>}<{<{<>}{[]{[]{}',
  '[[<[([]))<([[{}[[()]]]',
  '[{[{({}]{}}([{[{{{}}([]',
  '{<[[]]>}<{[{[{[]{()[[[]',
  '[<(<(<(<{}))><([]([]()',
  '<{([([[(<>()){}]>(<<{{',
  '<{([{{}}[<[[[<>{}]]]>[]]',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2021,
    day: 10,
    part: 2,
    title: 'Syntax Scoring',
    puzzleUrl: 'https://adventofcode.com/2021/day/10#part2',
    summary:
      'Discard corrupted and complete lines, derive the missing closing sequence from the remaining opener stack on each incomplete line, score it in base 5, and take the median.',
    algorithmSummary:
      'Validate bracket lines upfront, classify each via an O(N) stack pass, fold remaining openers in LIFO order into BigInt base-5 scores, and select the middle value under AUTOCOMPLETE_MEDIAN_POLICY.',
    complexity: 'O(L * N + K log K) time, O(N) stack space per line',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '288957',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: Part2Visualizer,
};
