import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { BeamCascadeVisualizer } from './viz/BeamCascadeVisualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2025,
    day: 7,
    part: 1,
    title: 'Laboratories',
    puzzleUrl: 'https://adventofcode.com/2025/day/7',
    summary: 'Simulate downward tachyon beams from emitter S and count how many splitters deflect them.',
    algorithmSummary:
      'Sweep row-by-row with ping-pong Uint8Array column presence buffers, merging overlapping split beams and counting hit ^ splitters.',
    complexity: 'O(R * C) time, O(C) solver space',
  },
  exampleInput: [
    '.......S.......', '...............', '.......^.......', '...............',
    '......^.^......', '...............', '.....^.^.^.....', '...............',
    '....^.^...^....', '...............', '...^.^...^.^...', '...............',
    '..^...^.....^..', '...............', '.^.^.^.^.^...^.', '...............',
  ].join('\n'),
  exampleAnswer: '21',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: BeamCascadeVisualizer,
};
