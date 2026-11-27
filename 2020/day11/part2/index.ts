import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { SeatingPart2Visualizer } from './viz/SeatingPart2Visualizer';

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
    part: 2,
    title: 'Seating System',
    puzzleUrl: 'https://adventofcode.com/2020/day/11#part2',
    summary:
      'Simulate synchronous seat occupancy updates using 8-direction line-of-sight visibility across floor tiles until reaching a fixed point, then count occupied seats.',
    algorithmSummary:
      'Cast 8 visibility rays per seat to precompute a CSR SeatGraph under LINE_OF_SIGHT_SEATING_RULE (crowdThreshold = 5) and advance ping-pong Uint8Array occupancy buffers until zero changes occur.',
    complexity: 'O(S * max(R, C)) ray preprocessing + O(S + E) per round, O(S) simulation memory',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '26',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: SeatingPart2Visualizer,
};
