import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { PrintQueueVisualizer } from './viz/PrintQueueVisualizer';

const EXAMPLE_INPUT = [
  '47|53', '97|13', '97|61', '97|47', '75|29', '61|13', '75|53',
  '29|13', '97|29', '53|29', '61|53', '97|53', '61|29', '47|13',
  '75|47', '97|75', '47|61', '75|61', '47|29', '75|13', '53|13',
  '',
  '75,47,61,53,29',
  '97,61,53,29,13',
  '75,29,13',
  '75,97,47,61,53',
  '61,13,29',
  '97,13,75,29,47',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2024,
    day: 5,
    part: 1,
    title: 'Print Queue',
    puzzleUrl: 'https://adventofcode.com/2024/day/5',
    summary: 'Identify updates whose pages satisfy every applicable ordering rule and sum their middle page numbers.',
    algorithmSummary:
      'Index ordering rules as a Map<number, Set<number>> and check every ordered pair (i < j) in each update for reversed precedence constraints.',
    complexity: 'O(R + U * L^2) time for R rules and U updates of length L, O(R + L) auxiliary space',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '143',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: PrintQueueVisualizer,
};
