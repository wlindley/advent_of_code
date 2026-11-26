import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { CosmicExpansionPart2Visualizer } from './viz/CosmicExpansionPart2Visualizer';

export const manifest: PuzzlePartManifest = Object.freeze({
  meta: Object.freeze({
    year: 2023,
    day: 11,
    part: 2,
    title: 'Cosmic Expansion',
    puzzleUrl: 'https://adventofcode.com/2023/day/11#part2',
    summary:
      'Replace every empty row and empty column in a 2D starfield observation with 1,000,000 empty slices and sum the Manhattan shortest-path distances over all unordered galaxy pairs.',
    algorithmSummary:
      'Decompose Manhattan distances into independent row and column axis sweeps and accumulate prefix * suffix * stepWidth (with 1_000_000n on empty rifts) in O(R + C) time without materializing expanded coordinates.',
    complexity: 'O(R * C) parsing and O(R + C) axis-sweep solving in exact BigInt arithmetic',
  }),
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
  exampleAnswer: '82000210',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: CosmicExpansionPart2Visualizer,
});
