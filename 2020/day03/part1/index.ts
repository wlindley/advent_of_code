import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { TobogganPart1Visualizer } from './viz/TobogganPart1Visualizer';

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
    part: 1,
    title: 'Toboggan Trajectory',
    puzzleUrl: 'https://adventofcode.com/2020/day/3',
    summary: 'Count trees encountered while descending a horizontally repeating grid at slope right 3, down 1.',
    algorithmSummary: 'Parse the grid into a ForestMap and step row-by-row with modular horizontal column wrapping.',
    complexity: 'O(R * C) parse, O(R) traversal time',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '7',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: TobogganPart1Visualizer,
};
