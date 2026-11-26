import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Visualizer } from './viz/Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2023,
    day: 7,
    part: 2,
    title: 'Camel Cards',
    puzzleUrl: 'https://adventofcode.com/2023/day/7#part2',
    summary:
      'Promote each 5-card hand by folding wild J cards into its largest non-joker group, break ties left-to-right with J weakest (J, 2..A), and sum rank * bid across the sorted deal.',
    algorithmSummary:
      'Fold J count into the descending non-joker frequency signature via jokerHandRule, encode each hand into a 24-bit packed integer key (4-bit HandType + five 4-bit J..A strengths), sort ascending with inputIndex tie-breaking, and accumulate BigInt winnings.',
    complexity: 'O(N log N) sorting and O(N) BigInt accumulation, O(N) space',
  },
  exampleInput: [
    '32T3K 765',
    'T55J5 684',
    'KK677 28',
    'KTJJT 220',
    'QQQJA 483',
  ].join('\n'),
  exampleAnswer: '5905',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer,
};
