import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Part1Visualizer } from './viz/Part1Visualizer';

const EXAMPLE_INPUT = [
  '00100',
  '11110',
  '10110',
  '10111',
  '10101',
  '01111',
  '00111',
  '11100',
  '10000',
  '11001',
  '00010',
  '01010',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2021,
    day: 3,
    part: 1,
    title: 'Binary Diagnostic',
    puzzleUrl: 'https://adventofcode.com/2021/day/3',
    summary: 'Compute gamma and epsilon rates from column bit frequencies and multiply them for power consumption.',
    algorithmSummary:
      'Parse binary rows into an immutable DiagnosticReport, tally 1/0 frequencies per column, select bits via MOST_COMMON_CRITERION / LEAST_COMMON_CRITERION, and multiply exact BigInt rates.',
    complexity: 'O(N * W) time, O(N * W) parsed storage',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '198',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: Part1Visualizer,
};
