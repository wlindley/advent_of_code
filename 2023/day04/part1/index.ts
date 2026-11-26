import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { ScratchcardsVisualizer } from './viz/ScratchcardsVisualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2023,
    day: 4,
    part: 1,
    title: 'Scratchcards',
    puzzleUrl: 'https://adventofcode.com/2023/day/4',
    summary:
      'Score each scratchcard by counting how many owned numbers match its winning set, awarding 2^(k - 1) points for k > 0 matches, and sum across all cards.',
    algorithmSummary:
      'Parse each card into frozen winning/owned number lists, intersect owned numbers against a Set of winning numbers to compute k and 2^(k - 1) with safe-integer bounds, and accumulate totals.',
    complexity: 'O(N·(W + M)) parse and scoring time, O(W) per-card Set space',
  },
  exampleInput: [
    'Card 1: 41 48 83 86 17 | 83 86  6 31 17  9 48 53',
    'Card 2: 13 32 20 16 61 | 61 30 68 82 17 32 24 19',
    'Card 3:  1 21 53 59 44 | 69 82 63 72 16 21 14  1',
    'Card 4: 41 92 73 84 69 | 59 84 76 51 58  5 54 83',
    'Card 5: 87 83 26 28 32 | 88 30 70 12 93 22 82 36',
    'Card 6: 31 18 13 56 72 | 74 77 10 23 35 67 36 11',
  ].join('\n'),
  exampleAnswer: '13',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: ScratchcardsVisualizer,
};
