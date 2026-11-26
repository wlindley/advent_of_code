import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { GearInspectorVisualizer } from './viz/GearInspectorVisualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2023,
    day: 3,
    part: 2,
    title: 'Gear Ratios',
    puzzleUrl: 'https://adventofcode.com/2023/day/3#part2',
    summary:
      'Find every "*" symbol adjacent to exactly two part numbers, multiply each pair to obtain its gear ratio, and sum all gear ratios in exact integer precision.',
    algorithmSummary:
      'Reuse the Int32Array cell-to-part-ID schematic index to probe the 8-neighborhood of every "*" candidate, compute BigInt products for degree-2 pairs without global part deduplication, and sum all gear ratios.',
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
  exampleAnswer: '467835',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: GearInspectorVisualizer,
};
