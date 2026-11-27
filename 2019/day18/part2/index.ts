import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Visualizer } from './viz/Visualizer';

const EXAMPLE_4 = [
  '#############',
  '#g#f.D#..h#l#',
  '#F###e#E###.#',
  '#dCba@#@BcIJ#',
  '#############',
  '#nK.L@#@G...#',
  '#M###N#H###.#',
  '#o#m..#i#jk.#',
  '#############',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2019,
    day: 18,
    part: 2,
    title: 'Many-Worlds Interpretation',
    puzzleUrl: 'https://adventofcode.com/2019/day/18#part2',
    summary:
      'Split the vault into four quadrants and coordinate four remote-controlled robots to collect every key across shared doors in the fewest total steps.',
    algorithmSummary:
      'Transform single-@ maps into a 4-robot split (or accept 4-@ layouts), build a Pareto-minimal key-dependency graph, and run Dijkstra over 46-bit (heldMask, r0..r3) states.',
    complexity: 'O(N * V * P + E_s log S) time for N nodes, V grid cells, P Pareto door masks, and S reachable 4-robot key-mask states',
  },
  exampleInput: EXAMPLE_4,
  exampleAnswer: '72',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer,
};
