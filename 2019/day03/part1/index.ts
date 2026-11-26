import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Visualizer } from './viz/Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2019,
    day: 3,
    part: 1,
    title: 'Crossed Wires',
    puzzleUrl: 'https://adventofcode.com/2019/day/3',
    summary:
      'Trace two Manhattan wire paths from the central port and find the closest non-origin crossing by Manhattan distance.',
    algorithmSummary:
      'Convert wire moves into BigInt WireSegments, intersect orthogonal and collinear ClosedInterval spans, exclude (0,0), and minimize |x| + |y|.',
    complexity: 'O(N * M) time, O(N + M + K) memory for N, M segments and K crossings',
  },
  exampleInput: 'R8,U5,L5,D3\nU7,R6,D4,L4',
  exampleAnswer: '6',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer,
};
