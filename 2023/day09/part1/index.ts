import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Visualizer } from './viz/Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2023,
    day: 9,
    part: 1,
    title: 'Mirage Maintenance',
    puzzleUrl: 'https://adventofcode.com/2023/day/9',
    summary:
      'Repeatedly compute adjacent finite differences for each OASIS history until reaching an all-zero layer, then extrapolate each sequence forward and sum the predicted next values.',
    algorithmSummary:
      'Construct an immutable BigInt difference pyramid per history down to its all-zero layer and fold bottom-up with a forward addition strategy.',
    complexity: 'O(N * L^2) worst-case time and space (often O(N * d * L) for degree d)',
  },
  exampleInput: [
    '0 3 6 9 12 15',
    '1 3 6 10 15 21',
    '10 13 16 21 30 45',
  ].join('\n'),
  exampleAnswer: '114',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer,
};
