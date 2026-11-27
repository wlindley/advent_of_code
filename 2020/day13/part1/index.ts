import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { ShuttlePart1Visualizer } from './viz/ShuttlePart1Visualizer';

const EXAMPLE_INPUT = ['939', '7,13,x,x,59,x,31,19'].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2020,
    day: 13,
    part: 1,
    title: 'Shuttle Search',
    puzzleUrl: 'https://adventofcode.com/2020/day/13',
    summary:
      'Find the earliest active shuttle bus departing at or after the target timestamp and multiply its ID by the wait minutes.',
    algorithmSummary:
      'Parse two-line shuttle notes into a BusSchedule and evaluate each active BusEntry wait modulo its period under EARLIEST_BUS_POLICY.',
    complexity: 'O(N) time and O(N) parsed storage across N active buses; O(1) solver state',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '295',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: ShuttlePart1Visualizer,
};
