import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Visualizer } from './viz/Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2019,
    day: 4,
    part: 2,
    title: 'Secure Container',
    puzzleUrl: 'https://adventofcode.com/2019/day/4#part2',
    summary:
      'Count 6-digit passwords within a numeric range whose digits never decrease and contain at least one adjacent matching pair of length exactly two.',
    algorithmSummary:
      'Jump directly across non-monotone gaps with ceilNonDecreasing/nextNonDecreasing and evaluate contiguous digit runs against EXACT_PAIR_POLICY.',
    complexity: 'O(K) time over K monotone candidates (K <= 3003), O(1) solve memory',
  },
  exampleInput: '111111-123789',
  exampleAnswer: '533',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer,
};
