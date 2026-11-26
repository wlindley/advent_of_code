import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { ReindeerMazePart1Visualizer } from './viz/ReindeerMazePart1Visualizer';

const EXAMPLE_INPUT = [
  '###############',
  '#.......#....E#',
  '#.#.###.#.###.#',
  '#.....#.#...#.#',
  '#.###.#####.#.#',
  '#.#.#.......#.#',
  '#.#.#####.###.#',
  '#...........#.#',
  '###.#.#####.#.#',
  '#...#.....#.#.#',
  '#.#.#.###.#.#.#',
  '#.....#...#.#.#',
  '#.###.#.#.#.#.#',
  '#S..#.....#...#',
  '###############',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2024,
    day: 16,
    part: 1,
    title: 'Reindeer Maze',
    puzzleUrl: 'https://adventofcode.com/2024/day/16',
    summary:
      'Find the lowest-cost route from S (facing East) to E through a walled maze where forward steps cost 1 and 90-degree turns cost 1000.',
    algorithmSummary:
      'State-space Dijkstra over (cell, direction) backed by flat TypedArrays and a binary min-heap, pruning expansions above the best end score.',
    complexity: 'O(V log V) time over 4*W*H states, O(W*H) grid & heap space',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '7036',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: ReindeerMazePart1Visualizer,
};
