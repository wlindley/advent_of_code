import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { WarehousePart2Visualizer } from './viz/WarehousePart2Visualizer';

const EXAMPLE_INPUT = [
  '##########',
  '#..O..O.O#',
  '#......O.#',
  '#.OO..O.O#',
  '#..O@..O.#',
  '#O#..O...#',
  '#O..O..O.#',
  '#.OO.O.OO#',
  '#....O...#',
  '##########',
  '',
  '<vv>^<v^>v>^vv^v>v<>v^v<v<^vv<<<^><<><>>v<vvv<>^v^>^<<<><<v<<<v^vv^v>^',
  'vvv<<^>^v^^><<>>><>^<<><^vv^^<>vvv<>><^^v>^>vv<>v<<<<v<^v>^<^^>>>^<v<v',
  '><>vv>v^v^<>><>>>><^^>vv>v<^^^>>v^v^<^^>v^^>v^<^v>v<>>v^v^<v>v^^<^^vv<',
  '<<v<^>>^^^^>>>v^<>vvv^><v<<<>^^^vv^<vvv>^>v<^^^^v<>^>vvvv><>>v^<<^^^^^',
  '^><^><>>><>^^<<^^v>>><^<v>^<vv>>v>>>^v><>^v><<<<v>>v<v<v>vvv>^<><<>^><',
  '^>><>^v<><^vvv<^^<><v<<<<<><^v<<<><<<^^<v<^^^><^>>^<v^><<<^>>^v<v^v<v^',
  '>^>>^v>vv>^<<^v<>><<><<v<<v><>v<^vv<<<>^^v^>^^>>><<^v>>v^v><^^>>^<>vv^',
  '<><^^>^^^<><vvvvv^v<v<<>^v<v>v<<^><<><<><<<^^<<<^<<>><<><^^^>^^<>^>v<>',
  '^^>vv<^v^v<vv>^<><v<^v>^^^>>>^^vvv^>vvv<>>>^<^>>>>>^<<^v>^vvv<>^<><<v>',
  'v^^>>><<^^<>>^v^<v^vv<>v^<<>^<^v^v><^<<<><<^<v><v<>vv>>v><v^<vv<>v^<<^',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2024,
    day: 15,
    part: 2,
    title: 'Warehouse Woes',
    puzzleUrl: 'https://adventofcode.com/2024/day/15',
    summary:
      'Widen the warehouse horizontally by 2x so each crate spans `[]`, simulate cascading vertical and horizontal pushes, and sum 100*row + col for every crate’s left `[` edge.',
    algorithmSummary:
      'Widen tiles at build time (`#`->`##`, `O`->`[]`, `.`->`..`, `@`->`@.`). Push horizontally along the movement row, or run a deduplicated BFS over linked `[`/`]` crate pairs for vertical moves and commit via a two-pass clear-then-write only when every dependent crate is unblocked.',
    complexity: 'O(M * B) time per move over pushed crate cluster B, O(W * H) grid space',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '9021',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: WarehousePart2Visualizer,
};
