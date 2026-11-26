import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { ReactorPathVisualizer } from './viz/ReactorPathVisualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2025,
    day: 11,
    part: 1,
    title: 'Reactor',
    puzzleUrl: 'https://adventofcode.com/2025/day/11',
    summary: 'Count all distinct directed paths leading from device `you` to device `out` across the reactor wiring graph.',
    algorithmSummary:
      'Prune to the s-t relevant subgraph via forward/backward BFS, topologically sort with Kahn\'s algorithm, and propagate exact BigInt path counts forward.',
    complexity: 'O(V + E)',
  },
  exampleInput: [
    'aaa: you hhh', 'you: bbb ccc', 'bbb: ddd eee', 'ccc: ddd eee fff', 'ddd: ggg',
    'eee: out', 'fff: out', 'ggg: out', 'hhh: ccc fff iii', 'iii: out',
  ].join('\n'),
  exampleAnswer: '5',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: ReactorPathVisualizer,
};
