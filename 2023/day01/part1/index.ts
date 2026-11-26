import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { CalibrationScannerVisualizer } from './viz/CalibrationScannerVisualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2023,
    day: 1,
    part: 1,
    title: 'Trebuchet?!',
    puzzleUrl: 'https://adventofcode.com/2023/day/1',
    summary: 'Extract the first and last ASCII digits on each line to form a two-digit calibration value and sum all lines.',
    algorithmSummary:
      'Scan each line forward from index 0 and backward to the first match for ASCII 0–9 digits, accumulating first * 10 + last in one pass.',
    complexity: 'O(L) total characters time, O(1) auxiliary space',
  },
  exampleInput: '1abc2\npqr3stu8vwx\na1b2c3d4e5f\ntreb7uchet',
  exampleAnswer: '142',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: CalibrationScannerVisualizer,
};
