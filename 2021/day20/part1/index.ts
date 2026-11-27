import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Part1Visualizer } from './viz/Part1Visualizer';

const EXAMPLE_INPUT = [
  '..#.#..#####.#.#.#.###.##.....###.##.#..###.####..#####..#....#..#..##..##',
  '#..######.###...####..#..#####..##..#.#####...##.#.#..#.##..#.#......#.###',
  '.######.###.####...#.##.##..#..#..#####.....#.#....###..#.##......#.....#.',
  '.#..#..##..#...##.######.####.####.#.#...#.......#..#.#.#...####.##.#.....',
  '.#..#...##.#.##..#...##.#.##..###.#......#.#.......#.#.#.####.###.##...#..',
  '...####.#..#..#.##.#....##..#.####....##...##..#...#......#.#.......#.....',
  '..##..####..#...#.#.#...##..#.#..###..#####........#..####......#..#',
  '',
  '#..#.',
  '#....',
  '##..#',
  '..#..',
  '..###',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2021,
    day: 20,
    part: 1,
    title: 'Trench Map',
    puzzleUrl: 'https://adventofcode.com/2021/day/20',
    summary:
      'Apply two simultaneous 3x3 cellular-automaton enhancement passes over an infinite 2D pixel grid while tracking uniform-void parity, then count lit pixels.',
    algorithmSummary:
      'Double-buffered Uint8Array convolution with a 2-cell explicit void halo, rolling 3-bit horizontal windows, and exact outer-void bit transitions.',
    complexity: 'O(S * (H + 2S) * (W + 2S)) time and O((H + 2S) * (W + 2S)) space for S = 2 passes',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '35',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: Part1Visualizer,
};
