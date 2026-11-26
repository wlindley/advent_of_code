import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { CosmicExpansionPart1Visualizer } from './viz/CosmicExpansionPart1Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2023,
    day: 11,
    part: 1,
    title: 'Cosmic Expansion',
    puzzleUrl: 'https://adventofcode.com/2023/day/11',
    summary:
      'Double every empty row and empty column in a 2D starfield observation and compute the sum of Manhattan shortest-path distances over all unordered galaxy pairs.',
    algorithmSummary:
      'Decompose Manhattan distances across rows and columns and accumulate each cut in O(R + C) time using prefix * suffix * stepWidth without materializing an expanded grid.',
    complexity: 'O(R * C) parsing and O(R + C) axis-sweep solving in exact BigInt arithmetic',
  },
  exampleInput: [
    '...#......',
    '.......#..',
    '#.........',
    '..........',
    '......#...',
    '.#........',
    '.........#',
    '..........',
    '.......#..',
    '#...#.....',
  ].join('\n'),
  exampleAnswer: '374',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: CosmicExpansionPart1Visualizer,
};
