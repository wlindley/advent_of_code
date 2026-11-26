import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { LongWalkPart1Visualizer } from './viz/LongWalkPart1Visualizer';

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
    part: 1,
    title: 'A Long Walk',
    puzzleUrl: 'https://adventofcode.com/2023/day/23',
    summary:
      'Find the longest non-repeating scenic hike from the single top opening to the single bottom opening while obeying one-way directional slopes.',
    algorithmSummary:
      'Contract degree-<=2 corridors into a weighted junction graph, pack edges in descending-weight CSR order, and solve exact longest simple path with forced-exit and max-incoming branch-and-bound pruning.',
    complexity: 'O(R * C) graph contraction + O(b^V) pruned DFS over junction count V',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '94',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: LongWalkPart1Visualizer,
};
