import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { TicketPart2Visualizer } from './viz/TicketPart2Visualizer';

const EXAMPLE_INPUT = [
  'departure class: 0-1 or 4-19',
  'departure row: 0-5 or 8-19',
  'seat: 0-13 or 16-19',
  '',
  'your ticket:',
  '11,12,13',
  '',
  'nearby tickets:',
  '3,9,18',
  '15,1,5',
  '5,14,9',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2020,
    day: 16,
    part: 2,
    title: 'Ticket Translation',
    puzzleUrl: 'https://adventofcode.com/2020/day/16#part2',
    summary:
      'Discard invalid nearby tickets, deduce the unique rule-to-column mapping by degree-1 peeling, and multiply departure fields on your ticket.',
    algorithmSummary:
      'Filter valid tickets via IntervalUnion, build bigint column-compatibility bitmasks per rule, and iteratively peel unit-degree rules using bigintLog2.',
    complexity: 'O(T * F * (log R + R) + F^2) time and O(R + T * F) space',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '132',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: TicketPart2Visualizer,
};
