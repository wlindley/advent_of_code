import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { QuantumManifoldVisualizer } from './viz/QuantumManifoldVisualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2025,
    day: 7,
    part: 2,
    title: 'Laboratories',
    puzzleUrl: 'https://adventofcode.com/2025/day/7#part2',
    summary: 'Count all distinct quantum tachyon timelines generated from emitter S across splitter paths.',
    algorithmSummary:
      'Sweep row-by-row with ping-pong BigInt timeline counts per column, summing overlapping paths and recording log2 density.',
    complexity: 'O(R * C) BigInt additions, O(C) solver space',
  },
  exampleInput: [
    '.......S.......', '...............', '.......^.......', '...............',
    '......^.^......', '...............', '.....^.^.^.....', '...............',
    '....^.^...^....', '...............', '...^.^...^.^...', '...............',
    '..^...^.....^..', '...............', '.^.^.^.^.^...^.', '...............',
  ].join('\n'),
  exampleAnswer: '40',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: QuantumManifoldVisualizer,
};
