import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Visualizer } from './viz/Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2019,
    day: 4,
    part: 1,
    title: 'Secure Container',
    puzzleUrl: 'https://adventofcode.com/2019/day/4',
    summary:
      'Count 6-digit passwords within a numeric range whose digits never decrease and contain at least one adjacent matching pair.',
    algorithmSummary:
      'Jump directly across non-monotone gaps with ceilNonDecreasing/nextNonDecreasing and evaluate contiguous digit runs against AT_LEAST_PAIR_POLICY.',
    complexity: 'O(K) time over K monotone candidates (K <= 3003), O(1) solve memory',
  },
  exampleInput: '111111-123789',
  exampleAnswer: '674',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer,
};
