import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { FuelPart1Visualizer } from './viz/FuelPart1Visualizer';

const EXAMPLE_INPUT = [
  '1=-0-2',
  '12111',
  '2=0=',
  '21',
  '2=01',
  '111',
  '20012',
  '112',
  '1=-1=',
  '1-12',
  '12',
  '1=',
  '122',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2022,
    day: 25,
    part: 1,
    title: 'Full of Hot Air',
    puzzleUrl: 'https://adventofcode.com/2022/day/25',
    summary:
      'Sum all balanced base-5 (SNAFU) fuel requirements across the hot-air balloon ledger and express the total as a canonical SNAFU number.',
    algorithmSummary:
      'Exact BigInt Horner decoding across balanced base-5 digits {-2,-1,0,1,2} followed by floor-division carry encoding via floorDiv(r + 2, 5).',
    complexity: 'O(N * L) time and O(N * L) space for N ledger lines of max length L',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '2=-1=0',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: FuelPart1Visualizer,
};
