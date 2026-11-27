import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Visualizer } from './viz/Visualizer';

const EXAMPLE_4 = [
  '#################',
  '#i.G..c...e..H.p#',
  '########.########',
  '#j.A..b...f..D.o#',
  '########@########',
  '#k.E..a...g..B.n#',
  '########.########',
  '#l.F..d...h..C.m#',
  '#################',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2019,
    day: 18,
    part: 1,
    title: 'Many-Worlds Interpretation',
    puzzleUrl: 'https://adventofcode.com/2019/day/18',
    summary:
      'Navigate the underground vault from the single entrance, unlocking lettered doors with matching keys to collect every key in the fewest total steps.',
    algorithmSummary:
      'Build a Pareto-minimal key-dependency graph via BFS tracking door masks and intermediate keys, then run Dijkstra over 46-bit (heldMask, robotNode) states.',
    complexity: 'O(N * V * P + E_s log S) time for N nodes, V grid cells, P Pareto door masks, and S reachable key-mask states',
  },
  exampleInput: EXAMPLE_4,
  exampleAnswer: '136',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer,
};
