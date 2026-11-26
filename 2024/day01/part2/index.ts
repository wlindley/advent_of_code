import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { SimilarityScoreVisualizer } from './viz/SimilarityScoreVisualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2024,
    day: 1,
    part: 2,
    title: 'Historian Hysteria',
    puzzleUrl: 'https://adventofcode.com/2024/day/1#part2',
    summary: 'Multiply each left location ID by its frequency in the right list and sum the similarity contributions.',
    algorithmSummary:
      'Build a right-column frequency map in O(N), then scan the left column and accumulate BigInt products.',
    complexity: 'O(N) time, O(N) space',
  },
  exampleInput: '3   4\n4   3\n2   5\n1   3\n3   9\n3   3',
  exampleAnswer: '31',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: SimilarityScoreVisualizer,
};
