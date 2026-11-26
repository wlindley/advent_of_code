import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { DiffusionPart2Visualizer } from './viz/DiffusionPart2Visualizer';

const EXAMPLE_INPUT = [
  '....#..',
  '..###.#',
  '#...#.#',
  '.#...##',
  '#.###..',
  '##.#.##',
  '.#..#..',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2022,
    day: 23,
    part: 2,
    title: 'Unstable Diffusion',
    puzzleUrl: 'https://adventofcode.com/2022/day/23#part2',
    summary:
      'Simulate synchronous elf proposal and collision resolution on an unbounded grid until no elf moves, returning the first static round.',
    algorithmSummary:
      'Bit-packed 8-neighbor occupancy LUT (1024 entries) with flat TypedArray grid growth, 2-branch tag collision resolution, and static-round early exit.',
    complexity: 'O(R * N + B) time and O(G) grid buffer space up to static round R for N elves',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '20',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: DiffusionPart2Visualizer,
};
