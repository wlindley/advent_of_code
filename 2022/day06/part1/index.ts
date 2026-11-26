import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { TuningTroubleVisualizer } from './viz/TuningTroubleVisualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2022,
    day: 6,
    part: 1,
    title: 'Tuning Trouble',
    puzzleUrl: 'https://adventofcode.com/2022/day/6',
    summary: 'Locate the 1-based end position of the first 4-character substring with all distinct letters.',
    algorithmSummary:
      'Maintain a 26-entry Int32Array of last-seen character indices and advance the window start monotonically past any in-window duplicate in O(N) time and O(1) space.',
    complexity: 'O(N) time, O(1) space',
  },
  exampleInput: 'mjqjpqmgbljsphdztnvjfqwrcgsmlb',
  exampleAnswer: '7',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: TuningTroubleVisualizer,
};
