import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { LongWalkPart2Visualizer } from './viz/LongWalkPart2Visualizer';

const EXAMPLE_INPUT = [
  '#.#####################',
  '#.......#########...###',
  '#######.#########.#.###',
  '###.....#.>.>.###.#.###',
  '###v#####.#v#.###.#.###',
  '###.>...#.#.#.....#...#',
  '###v###.#.#.#########.#',
  '###...#.#.#.......#...#',
  '#####.#.#.#######.#.###',
  '#.....#.#.#.......#...#',
  '#.#####.#.#.#########v#',
  '#.#...#...#...###...>.#',
  '#.#.#v#######v###.###v#',
  '#...#.>.#...>.>.#.###.#',
  '#####v#.#.###v#.#.###.#',
  '#.....#...#...#.#.#...#',
  '#.#########.###.#.#.###',
  '#...###...#...#...#.###',
  '###.###.#.###v#####v###',
  '#...#...#.#.>.>.#.>.###',
  '#.###.###.#.###.#.#v###',
  '#.....###...###...#...#',
  '#####################.#',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2023,
    day: 23,
    part: 2,
    title: 'A Long Walk',
    puzzleUrl: 'https://adventofcode.com/2023/day/23#part2',
    summary:
      'Find the longest non-repeating scenic hike from the single top opening to the single bottom opening when all directional slopes are climbable in both directions.',
    algorithmSummary:
      'Contract degree-<=2 corridors into an undirected weighted junction graph, pack edges in descending-weight CSR order, and solve exact longest simple path with forced-exit and max-incoming branch-and-bound pruning.',
    complexity: 'O(R * C) graph contraction + O(b^V) pruned DFS over junction count V',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '154',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: LongWalkPart2Visualizer,
};
