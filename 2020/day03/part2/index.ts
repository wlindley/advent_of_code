import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { TobogganPart2Visualizer } from './viz/TobogganPart2Visualizer';

const EXAMPLE_INPUT = [
  '..##.......',
  '#...#...#..',
  '.#....#..#.',
  '..#.#...#.#',
  '.#...##..#.',
  '..#.##.....',
  '.#.#.#....#',
  '.#........#',
  '#.##...#...',
  '#...##....#',
  '.#..#...#.#',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2020,
    day: 3,
    part: 2,
    title: 'Toboggan Trajectory',
    puzzleUrl: 'https://adventofcode.com/2020/day/3#part2',
    summary: 'Multiply tree encounters across five toboggan slopes descending a horizontally repeating grid.',
    algorithmSummary: 'Parse the grid into a ForestMap and multiply BigInt tree counts across all five slopes with modular horizontal wrapping.',
    complexity: 'O(R * C) parse, O(S * R) traversal time',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '336',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: TobogganPart2Visualizer,
};
