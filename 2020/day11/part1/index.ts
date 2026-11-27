import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { SeatingPart1Visualizer } from './viz/SeatingPart1Visualizer';

const EXAMPLE_INPUT = [
  'L.LL.LL.LL',
  'LLLLLLL.LL',
  'L.L.L..L..',
  'LLLL.LL.LL',
  'L.LL.LL.LL',
  'L.LLLLL.LL',
  '..L.L.....',
  'LLLLLLLLLL',
  'L.LLLLLL.L',
  'L.LLLLL.LL',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2020,
    day: 11,
    part: 1,
    title: 'Seating System',
    puzzleUrl: 'https://adventofcode.com/2020/day/11',
    summary:
      'Simulate synchronous seat occupancy updates using immediate 8-neighbor counts until reaching a fixed point, then count occupied seats.',
    algorithmSummary:
      'Index non-floor seats into a CSR SeatGraph under ADJACENT_SEATING_RULE (crowdThreshold = 4) and advance ping-pong Uint8Array occupancy buffers until zero changes occur.',
    complexity: 'O(S + E) per round across S seats and E <= 8S edges, O(S) simulation memory',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '37',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: SeatingPart1Visualizer,
};
