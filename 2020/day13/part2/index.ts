import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { ShuttlePart2Visualizer } from './viz/ShuttlePart2Visualizer';

const EXAMPLE_INPUT = ['939', '7,13,x,x,59,x,31,19'].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2020,
    day: 13,
    part: 2,
    title: 'Shuttle Search',
    puzzleUrl: 'https://adventofcode.com/2020/day/13',
    summary:
      'Find the earliest timestamp where each active shuttle bus departs at its scheduled minute offset.',
    algorithmSummary:
      'Fold per-bus modular congruences t ≡ -offset (mod id) with generalized BigInt CRT under CONSECUTIVE_ALIGNMENT_POLICY.',
    complexity: 'O(N log M) BigInt arithmetic and O(N) parsed storage across N active buses',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '1068781',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: ShuttlePart2Visualizer,
};
