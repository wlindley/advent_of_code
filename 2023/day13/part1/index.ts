import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { IncidencePart1Visualizer } from './viz/IncidencePart1Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2023,
    day: 13,
    part: 1,
    title: 'Point of Incidence',
    puzzleUrl: 'https://adventofcode.com/2023/day/13',
    summary:
      'Locate the unique vertical or horizontal line of exact reflection in each ash-and-rock mirror field and sum their summary scores.',
    algorithmSummary:
      'Encode rows and columns as BigInt bitmasks, then scan all candidate axes using XOR + Brian Kernighan popcount with early smudge-limit pruning.',
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
  exampleAnswer: '405',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: IncidencePart1Visualizer,
};
