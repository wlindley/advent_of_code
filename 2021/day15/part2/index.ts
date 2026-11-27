import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Part2Visualizer } from './viz/Part2Visualizer';

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
    part: 2,
    title: 'Chiton',
    puzzleUrl: 'https://adventofcode.com/2021/day/15#part2',
    summary:
      'Tile the cavern 5x5 with wrap-around risk increments (1..9) and find the minimum-total-risk four-neighbor path from top-left to bottom-right without counting the start cell.',
    algorithmSummary:
      'Expand the base grid via wrapRisk((base - 1 + tr + tc) % 9 + 1) and run 10-bucket Dial’s Dijkstra on the flat typed 25x grid with zero stale queue entries.',
    complexity: 'O(V + D) time, O(V) space for V = 25·R·C cells and max distance D',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '315',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: Part2Visualizer,
};
