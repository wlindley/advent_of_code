import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { LocationDistanceVisualizer } from './viz/LocationDistanceVisualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2024,
    day: 1,
    part: 1,
    title: 'Historian Hysteria',
    puzzleUrl: 'https://adventofcode.com/2024/day/1',
    summary: 'Sort both location ID lists ascending and sum the absolute differences of rank-matched pairs.',
    algorithmSummary:
      'Sort each column numerically via Float64Array, pair elements by sorted rank, and accumulate safe integer distances.',
    complexity: 'O(N log N) time, O(N) space',
  },
  exampleInput: '3   4\n4   3\n2   5\n1   3\n3   9\n3   3',
  exampleAnswer: '11',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: LocationDistanceVisualizer,
};
