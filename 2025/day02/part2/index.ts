import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { InclusionBandVisualizer } from './viz/InclusionBandVisualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2025,
    day: 2,
    part: 2,
    title: 'Gift Shop',
    puzzleUrl: 'https://adventofcode.com/2025/day/2#part2',
    summary: 'Scan closed ID ranges and sum all unique integers formed by repeating any digit sequence at least twice.',
    algorithmSummary:
      'Decompose each digit length via squarefree Möbius inclusion-exclusion, clamp each k×r band via M = (10^L - 1)/(10^k - 1), and sum signed arithmetic progressions.',
    complexity: 'O(R * D * d(D)) time, O(1) space',
  },
  exampleInput:
    '11-22,95-115,998-1012,1188511880-1188511890,222220-222224,1698522-1698528,' +
    '446443-446449,38593856-38593862,565653-565659,824824821-824824827,2121212118-2121212124',
  exampleAnswer: '4174379265',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: InclusionBandVisualizer,
};
