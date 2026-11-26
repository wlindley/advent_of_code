import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import {
  CodeChroniclePart1Visualizer,
  PART1_EXAMPLE_INPUT,
} from './viz/CodeChroniclePart1Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2024,
    day: 25,
    part: 1,
    title: 'Code Chronicle',
    puzzleUrl: 'https://adventofcode.com/2024/day/25',
    summary:
      'Count all unique lock and key schematic pairs whose pin and tooth column heights fit within the chamber without overlapping.',
    algorithmSummary:
      'Parse each W × H schematic into validated pin/tooth height vectors and evaluate every lock/key pair with early-exit column-sum checks (lock[c] + key[c] <= H - 2).',
    complexity: 'O(L · K · W) time and O((L + K) · W) space for L locks, K keys, and width W',
  },
  exampleInput: PART1_EXAMPLE_INPUT,
  exampleAnswer: '3',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: CodeChroniclePart1Visualizer,
};
