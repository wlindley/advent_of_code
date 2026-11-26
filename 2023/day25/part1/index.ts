import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { SnowverloadPart1Visualizer } from './viz/SnowverloadPart1Visualizer';

const EXAMPLE_INPUT = [
  'jqt: rhn xhk nvd', 'rsh: frs pzl lsr', 'xhk: hfx', 'cmg: qnr nvd lhk bvb',
  'rhn: xhk bvb hfx', 'bvb: xhk hfx', 'pzl: lsr hfx nvd', 'qnr: nvd',
  'ntq: jqt hfx bvb xhk', 'nvd: lhk', 'lsr: lhk', 'rzs: qnr cmg lsr rsh', 'frs: qnr lhk lsr',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2023,
    day: 25,
    part: 1,
    title: 'Snowverload',
    puzzleUrl: 'https://adventofcode.com/2023/day/25',
    summary:
      'Sever the unique 3-wire minimum cut splitting the component network into two clusters and multiply their sizes.',
    algorithmSummary:
      'Builds an undirected forward-star graph, probes vertices in reverse BFS order with unit-capacity Edmonds-Karp capped at 4 augmenting paths until flow equals 3, and extracts the residual S/T partition.',
    complexity: 'O(V + E) per capped probe; O(k * (V + E)) total where k is probes to hit the opposite cluster',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '54',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: SnowverloadPart1Visualizer,
};
