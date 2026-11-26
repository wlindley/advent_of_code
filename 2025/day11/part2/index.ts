import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { ReactorWaypointVisualizer } from './viz/ReactorWaypointVisualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2025,
    day: 11,
    part: 2,
    title: 'Reactor — Part Two',
    puzzleUrl: 'https://adventofcode.com/2025/day/11#part2',
    summary: 'Count all distinct directed paths from `svr` to `out` that pass through both `dac` and `fft` in any order.',
    algorithmSummary:
      'Prune to the `svr`–`out` relevant subgraph, topologically sort, and propagate an immutable 4-bucket BigInt tuple partitioned by visited waypoint bitmask `{neither, dac, fft, both}`.',
    complexity: 'O(V + E)',
  },
  exampleInput: [
    'svr: aaa bbb', 'aaa: fft', 'fft: ccc', 'bbb: tty', 'tty: ccc', 'ccc: ddd eee',
    'ddd: hub', 'hub: fff', 'eee: dac', 'dac: fff', 'fff: ggg hhh', 'ggg: out', 'hhh: out',
  ].join('\n'),
  exampleAnswer: '2',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: ReactorWaypointVisualizer,
};
