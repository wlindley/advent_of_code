import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { DiffusionPart1Visualizer } from './viz/DiffusionPart1Visualizer';

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
    part: 1,
    title: 'Unstable Diffusion',
    puzzleUrl: 'https://adventofcode.com/2022/day/23',
    summary:
      'Simulate 10 rounds of synchronous elf proposal and collision resolution on an unbounded grid, then count empty ground tiles in the final tight bounding box.',
    algorithmSummary:
      'Bit-packed 8-neighbor occupancy LUT (1024 entries) with flat TypedArray grid growth and 2-branch tag collision resolution.',
    complexity: 'O(R * N + B) time and O(G) grid buffer space for R rounds and N elves',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '110',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: DiffusionPart1Visualizer,
};
