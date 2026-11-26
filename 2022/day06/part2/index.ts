import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { TuningTroublePart2Visualizer } from './viz/TuningTroublePart2Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2022,
    day: 6,
    part: 2,
    title: 'Tuning Trouble',
    puzzleUrl: 'https://adventofcode.com/2022/day/6#part2',
    summary: 'Locate the 1-based end position of the first 14-character substring with all distinct letters.',
    algorithmSummary:
      'Maintain a 26-entry Int32Array of last-seen character indices and advance the window start monotonically past any in-window duplicate in O(N) time and O(1) space.',
    complexity: 'O(N) time, O(1) space',
  },
  exampleInput: 'mjqjpqmgbljsphdztnvjfqwrcgsmlb',
  exampleAnswer: '19',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: TuningTroublePart2Visualizer,
};
