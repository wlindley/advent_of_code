import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { CathodeRayTubePart1Visualizer } from './viz/CathodeRayTubePart1Visualizer';

const EXAMPLE_LINES = [
  'addx 15', 'addx -11', 'addx 6', 'addx -3', 'addx 5', 'addx -1', 'addx -8', 'addx 13',
  'addx 4', 'noop', 'addx -1', 'addx 5', 'addx -1', 'addx 5', 'addx -1', 'addx 5',
  'addx -1', 'addx 5', 'addx -1', 'addx -35', 'addx 1', 'addx 24', 'addx -19', 'addx 1',
  'addx 16', 'addx -11', 'noop', 'noop', 'addx 21', 'addx -15', 'noop', 'noop',
  'addx -3', 'addx 9', 'addx 1', 'addx -3', 'addx 8', 'addx 1', 'addx 5', 'noop',
  'noop', 'noop', 'noop', 'noop', 'addx -36', 'noop', 'addx 1', 'addx 7',
  'noop', 'noop', 'noop', 'addx 2', 'addx 6', 'noop', 'noop', 'noop',
  'noop', 'noop', 'addx 1', 'noop', 'noop', 'addx 7', 'addx 1', 'noop',
  'addx -13', 'addx 13', 'addx 7', 'noop', 'addx 1', 'addx -33', 'noop', 'noop',
  'noop', 'addx 2', 'noop', 'noop', 'noop', 'addx 8', 'noop', 'addx -1',
  'addx 2', 'addx 1', 'noop', 'addx 17', 'addx -9', 'addx 1', 'addx 1', 'addx -3',
  'addx 11', 'noop', 'noop', 'addx 1', 'noop', 'addx 1', 'noop', 'noop',
  'addx -13', 'addx -19', 'addx 1', 'addx 3', 'addx 26', 'addx -30', 'addx 12', 'addx -1',
  'addx 3', 'addx 1', 'noop', 'noop', 'noop', 'addx -9', 'addx 18', 'addx 1',
  'addx 2', 'noop', 'noop', 'addx 9', 'noop', 'noop', 'noop', 'addx -1',
  'addx 2', 'addx -37', 'addx 1', 'addx 3', 'noop', 'addx 15', 'addx -21', 'addx 22',
  'addx -6', 'addx 1', 'noop', 'addx 2', 'addx 1', 'noop', 'addx -10', 'noop',
  'noop', 'addx 20', 'addx 1', 'addx 2', 'addx 2', 'addx -6', 'addx -11', 'noop',
  'noop', 'noop',
];

const EXAMPLE_INPUT = EXAMPLE_LINES.join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2022,
    day: 10,
    part: 1,
    title: 'Cathode-Ray Tube',
    puzzleUrl: 'https://adventofcode.com/2022/day/10',
    summary:
      'Simulate a clock-driven CPU executing noop and addx instructions and sum register X signal strengths at six probe cycles.',
    algorithmSummary:
      'Execute parsed instructions once into typed-array per-cycle timelines and sample signal strengths at cycles 20, 60, 100, 140, 180, and 220.',
    complexity: 'O(C) time, O(C) space',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '13140',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: CathodeRayTubePart1Visualizer,
};
