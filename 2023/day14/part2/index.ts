import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { DishPart2Visualizer } from './viz/DishPart2Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2023,
    day: 14,
    part: 2,
    title: 'Parabolic Reflector Dish',
    puzzleUrl: 'https://adventofcode.com/2023/day/14#part2',
    summary:
      'Repeatedly spin-tilt the dish north, west, south, and east for 1,000,000,000 cycles and compute the final north-beam load.',
    algorithmSummary:
      'Run spin cycles while hashing compact ASCII platform fingerprints in a Map to detect the first repeated state (μ, λ), then project targetCycles via modular arithmetic onto the observed cycle history.',
    complexity: 'O((μ + λ) * H * W) time and space',
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
  exampleAnswer: '64',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: DishPart2Visualizer,
};
