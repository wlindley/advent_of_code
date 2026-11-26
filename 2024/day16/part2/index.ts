import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { ReindeerMazePart2Visualizer } from './viz/ReindeerMazePart2Visualizer';

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
    part: 2,
    title: 'Reindeer Maze',
    puzzleUrl: 'https://adventofcode.com/2024/day/16#part2',
    summary:
      'Count all maze tiles that lie on at least one minimum-score route from S (facing East) to E.',
    algorithmSummary:
      'State-space Dijkstra from (S, East) followed by reverse tight-edge BFS across all optimal (E, dir) states to union every optimal tile.',
    complexity: 'O(V log V) time over 4*W*H states, O(W*H) mask & heap space',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '45',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: ReindeerMazePart2Visualizer,
};
