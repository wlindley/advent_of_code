import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import {
  MonkeyMarketPart2Visualizer,
  PART2_EXAMPLE_INPUT,
} from './viz/MonkeyMarketPart2Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2024,
    day: 22,
    part: 2,
    title: 'Monkey Market',
    puzzleUrl: 'https://adventofcode.com/2024/day/22#part2',
    summary:
      'Find the single 4-delta price-change sequence that maximizes total bananas sold on first occurrence across all buyers.',
    algorithmSummary:
      'Encode each 4-step price delta window in base-19 ([0, 130320]), deduplicate per buyer with a stamp table, and accumulate first-match prices in Int32Array totals.',
    complexity: 'O(B * S + K) time and O(K) space for B buyers, S = 2,000 steps, K = 19^4',
  },
  exampleInput: PART2_EXAMPLE_INPUT,
  exampleAnswer: '23',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: MonkeyMarketPart2Visualizer,
};
