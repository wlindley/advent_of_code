import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { ResonancePart1Visualizer } from './viz/ResonancePart1Visualizer';

const EXAMPLE_INPUT = [
  '............',
  '........0...',
  '.....0......',
  '.......0....',
  '....0.......',
  '......A.....',
  '............',
  '............',
  '........A...',
  '.........A..',
  '............',
  '............',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2024,
    day: 8,
    part: 1,
    title: 'Resonant Collinearity',
    puzzleUrl: 'https://adventofcode.com/2024/day/8',
    summary:
      'Count unique in-bounds grid locations containing an antinode formed at double-distance collinear reflections of same-frequency antenna pairs.',
    algorithmSummary:
      'Group antennas by case-sensitive frequency into an immutable AntennaMap, apply DOUBLE_DISTANCE_RULE per pair, and deduplicate in-bounds coordinates with a Uint8Array bitset.',
    complexity: 'O(R*C + sum(k_f^2)) time, O(R*C) space',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '14',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: ResonancePart1Visualizer,
};
