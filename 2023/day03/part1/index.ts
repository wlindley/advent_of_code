import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { GearRatiosVisualizer } from './viz/GearRatiosVisualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2023,
    day: 3,
    part: 1,
    title: 'Gear Ratios',
    puzzleUrl: 'https://adventofcode.com/2023/day/3',
    summary:
      'Sum every unsigned multi-digit number in the 2D engine schematic that touches at least one symbol horizontally, vertically, or diagonally.',
    algorithmSummary:
      'Index each horizontal digit span into an Int32Array cell-to-part-ID table, probe the 8-neighborhood of every symbol, and sum newly seen part IDs via a visited bitset.',
    complexity: 'O(R·C) parse and lookup time, O(R·C) index space',
  },
  exampleInput: [
    '467..114..',
    '...*......',
    '..35..633.',
    '......#...',
    '617*......',
    '.....+.58.',
    '..592.....',
    '......755.',
    '...$.*....',
    '.664.598..',
  ].join('\n'),
  exampleAnswer: '4361',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: GearRatiosVisualizer,
};
