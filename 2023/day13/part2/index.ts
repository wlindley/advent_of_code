import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { IncidencePart2Visualizer } from './viz/IncidencePart2Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2023,
    day: 13,
    part: 2,
    title: 'Point of Incidence',
    puzzleUrl: 'https://adventofcode.com/2023/day/13#part2',
    summary:
      'Locate the unique reflection line revealed by flipping exactly one smudge cell in each ash-and-rock mirror field and sum the resulting scores.',
    algorithmSummary:
      'Encode rows and columns as BigInt bitmasks, then scan all candidate axes using XOR + Brian Kernighan popcount with early pruning at targetSmudges = 1.',
    complexity: 'O(H * W) encoding + O((H + W)^2) mask scan per pattern',
  },
  exampleInput: [
    '#.##..##.',
    '..#.##.#.',
    '##......#',
    '##......#',
    '..#.##.#.',
    '..##..##.',
    '#.#.##.#.',
    '',
    '#...##..#',
    '#....#..#',
    '..##..###',
    '#####.##.',
    '#####.##.',
    '..##..###',
    '#....#..#',
  ].join('\n'),
  exampleAnswer: '400',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: IncidencePart2Visualizer,
};
