import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { PipeMazePart2Visualizer } from './viz/PipeMazePart2Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2023,
    day: 10,
    part: 2,
    title: 'Pipe Maze',
    puzzleUrl: 'https://adventofcode.com/2023/day/10#part2',
    summary:
      'Count all non-loop tiles enclosed inside the main pipe loop, including areas only reachable from outside by squeezing between parallel pipes.',
    algorithmSummary:
      'Infer S and trace the main loop via 2023/day10/shared, then scan each row left-to-right toggling inside parity on main-loop tiles whose effective mask includes DIR_N.',
    complexity: 'O(R * C) time and O(R * C) space for the enclosed tile mask',
  },
  exampleInput: [
    'FF7FSF7F7F7F7F7F---7',
    'L|LJ||||||||||||F--J',
    'FL-7LJLJ||||||LJL-77',
    'F--JF--7||LJLJ7F7FJ-',
    'L---JF-JLJ.||-FJLJJ7',
    '|F|F-JF---7F7-L7L|7|',
    '|FFJF7L7F-JF7|JL---7',
    '7-L-JL7||F7|L7F-7F7|',
    'L.L7LFJ|||||FJL7||LJ',
    'L7JLJL-JLJLJL--JLJ.L',
  ].join('\n'),
  exampleAnswer: '10',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: PipeMazePart2Visualizer,
};
