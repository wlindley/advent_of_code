import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { ResonancePart2Visualizer } from './viz/ResonancePart2Visualizer';

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
    part: 2,
    title: 'Resonant Collinearity',
    puzzleUrl: 'https://adventofcode.com/2024/day/8#part2',
    summary:
      'Count unique in-bounds grid locations aligned with any pair of same-frequency antennas under resonant harmonics (including the antennas themselves).',
    algorithmSummary:
      'Group antennas by case-sensitive frequency into an AntennaMap, normalize pair deltas by gcd(dr, dc), cast bidirectional rays via HARMONIC_LINE_RULE, and deduplicate with a Uint8Array bitset.',
    complexity: 'O(sum(k_f^2) * max(R, C) + R*C) time, O(R*C) space',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '34',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: ResonancePart2Visualizer,
};
