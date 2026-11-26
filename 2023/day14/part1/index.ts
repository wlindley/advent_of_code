import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { DishPart1Visualizer } from './viz/DishPart1Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2023,
    day: 14,
    part: 1,
    title: 'Parabolic Reflector Dish',
    puzzleUrl: 'https://adventofcode.com/2023/day/14',
    summary:
      'Slide all rounded rocks north until blocked by cube rocks or the rim, then sum each rock’s distance-from-south beam load.',
    algorithmSummary:
      'Encode the grid into a row-major ASCII Uint8Array and compact each column northward in one linear pass using a moving write cursor reset at each `#` barrier.',
    complexity: 'O(H * W) time, O(H * W) space',
  },
  exampleInput: [
    'O....#....',
    'O.OO#....#',
    '.....##...',
    'OO.#O....O',
    '.O.....O#.',
    'O.#..O.#.#',
    '..O..#O..O',
    '.......O..',
    '#....###..',
    '#OO..#....',
  ].join('\n'),
  exampleAnswer: '136',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: DishPart1Visualizer,
};
