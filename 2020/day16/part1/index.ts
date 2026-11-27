import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { TicketPart1Visualizer } from './viz/TicketPart1Visualizer';

const EXAMPLE_INPUT = [
  'class: 1-3 or 5-7',
  'row: 6-11 or 33-44',
  'seat: 13-40 or 45-50',
  '',
  'your ticket:',
  '7,1,14',
  '',
  'nearby tickets:',
  '7,3,47',
  '40,4,50',
  '55,2,20',
  '38,6,12',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2020,
    day: 16,
    part: 1,
    title: 'Ticket Translation',
    puzzleUrl: 'https://adventofcode.com/2020/day/16',
    summary:
      'Scan nearby tickets against the coalesced union of all field interval rules and sum every invalid field value.',
    algorithmSummary:
      'Coalesce all field rules into a sorted IntervalUnion and binary-search each nearby ticket cell in O(log R) time per cell.',
    complexity: 'O(R log R + T * F log R) time and O(R + T * F) space',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '71',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: TicketPart1Visualizer,
};
