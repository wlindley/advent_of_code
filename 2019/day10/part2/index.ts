import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Visualizer } from './viz/Visualizer';

const EXAMPLE_INPUT = [
  '.#..##.###...#######', '##.############..##.', '.#.######.########.#', '.###.#######.####.#.',
  '#####.##.#.##.###.##', '..#####..#.#########', '####################', '#.####....###.#.#.##',
  '##.#################', '#####.##.###..####..', '..######..##.#######', '####.##.####...##..#',
  '.#####..#.######.###', '##...#.##########...', '#.##########.#######', '.####.#.###.###.#.##',
  '....##.##.###..#####', '.#.#.###########.###', '#.#.#.#####.####.###', '###.##.####.##.#..##',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2019,
    day: 10,
    part: 2,
    title: 'Monitoring Station',
    puzzleUrl: 'https://adventofcode.com/2019/day/10#part2',
    summary:
      'From the optimal monitoring station, sweep a vaporizing laser clockwise from straight up and report x * 100 + y for the 200th asteroid hit.',
    algorithmSummary:
      'Locate the optimal station via symmetric half-ray visibility counting, group remaining asteroids by coprime ray sorted by exact half-plane cross-product angle and step distance, and round-robin sweep.',
    complexity: 'O(A^2 log(W + H)) time for A asteroids on a WxH grid, O(W * H + A) space',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '802',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer,
};
