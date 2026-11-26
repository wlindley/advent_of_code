import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { CascadeWaveVisualizer } from './viz/CascadeWaveVisualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2023,
    day: 4,
    part: 2,
    title: 'Scratchcards',
    puzzleUrl: 'https://adventofcode.com/2023/day/4#part2',
    summary:
      'Start with one copy of each scratchcard, win one extra copy of the next k cards for each copy of a card with k matches, and compute the total card count with BigInt precision.',
    algorithmSummary:
      'Sweep cards once left-to-right with a BigInt difference array (delta[i + 1] += copies, delta[end + 1] -= copies) so range cascades resolve in O(N) time without inspecting card.points.',
    complexity: 'O(N·(W + M)) parse + O(N) cascade solve time, O(N) delta space',
  },
  exampleInput: [
    'Card 1: 41 48 83 86 17 | 83 86  6 31 17  9 48 53',
    'Card 2: 13 32 20 16 61 | 61 30 68 82 17 32 24 19',
    'Card 3:  1 21 53 59 44 | 69 82 63 72 16 21 14  1',
    'Card 4: 41 92 73 84 69 | 59 84 76 51 58  5 54 83',
    'Card 5: 87 83 26 28 32 | 88 30 70 12 93 22 82 36',
    'Card 6: 31 18 13 56 72 | 74 77 10 23 35 67 36 11',
  ].join('\n'),
  exampleAnswer: '30',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: CascadeWaveVisualizer,
};
