import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Part1Visualizer } from './viz/Part1Visualizer';

const EXAMPLE_INPUT = [
  '1163751742',
  '1381373672',
  '2136511328',
  '3694931569',
  '7463417111',
  '1319128137',
  '1359912421',
  '3125421639',
  '1293138521',
  '2311944581',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2021,
    day: 15,
    part: 1,
    title: 'Chiton',
    puzzleUrl: 'https://adventofcode.com/2021/day/15',
    summary:
      'Find a minimum-total-risk four-neighbor path from the top-left cell to the bottom-right cell of a weighted digit grid without counting the starting cell.',
    algorithmSummary:
      'Run 10-bucket Dial’s Dijkstra on a flat typed grid; because edge weights depend solely on the entered vertex (1..9), the first discovery of each cell is optimal with zero stale entries.',
    complexity: 'O(V + D) time, O(V) space for V = R·C cells and max distance D',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '40',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: Part1Visualizer,
};
