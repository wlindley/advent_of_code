import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Part1Visualizer } from './viz/Part1Visualizer';

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
    part: 1,
    title: 'Syntax Scoring',
    puzzleUrl: 'https://adventofcode.com/2021/day/10',
    summary:
      'Scan each navigation subsystem line with a bracket stack, locate the first mismatched closing delimiter on corrupted lines, and sum their penalty weights.',
    algorithmSummary:
      'Validate bracket lines upfront, classify each via a single O(N) stack pass, and aggregate BigInt corruption scores under CORRUPTION_SCORE_POLICY.',
    complexity: 'O(L * N) time, O(N) stack space per line',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '26397',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: Part1Visualizer,
};
