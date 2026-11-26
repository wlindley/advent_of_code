import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Visualizer } from './viz/Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2023,
    day: 7,
    part: 1,
    title: 'Camel Cards',
    puzzleUrl: 'https://adventofcode.com/2023/day/7',
    summary:
      'Classify each 5-card Camel Cards hand into one of seven strength tiers, break same-tier ties left-to-right by standard card order (2..A), and sum rank * bid across the sorted deal.',
    algorithmSummary:
      'Encode each hand under standardHandRule into a 24-bit packed integer key (4-bit HandType + five 4-bit card strengths), sort ascending with inputIndex tie-breaking, and accumulate BigInt winnings.',
    complexity: 'O(N log N) sorting and O(N) BigInt accumulation, O(N) space',
  },
  exampleInput: [
    '32T3K 765',
    'T55J5 684',
    'KK677 28',
    'KTJJT 220',
    'QQQJA 483',
  ].join('\n'),
  exampleAnswer: '6440',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer,
};
