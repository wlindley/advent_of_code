import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { SpelledCalibrationVisualizer } from './viz/SpelledCalibrationVisualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2023,
    day: 1,
    part: 2,
    title: 'Trebuchet?!',
    puzzleUrl: 'https://adventofcode.com/2023/day/1#part2',
    summary:
      'Extract the first and last calibration digits (ASCII 0–9 or spelled words one–nine) on each line, including overlapping words, and sum all lines.',
    algorithmSummary:
      'Scan each line forward from index 0 and backward to the first match using first-character bucketed word lookup plus ASCII digit checks.',
    complexity: 'O(L) total characters time, O(1) auxiliary space',
  },
  exampleInput:
    'two1nine\neightwothree\nabcone2threexyz\nxtwone3four\n4nineeightseven2\nzoneight234\n7pqrstsixteen',
  exampleAnswer: '281',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: SpelledCalibrationVisualizer,
};
