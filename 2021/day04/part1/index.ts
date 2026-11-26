import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Part1Visualizer } from './viz/Part1Visualizer';

const EXAMPLE_INPUT = [
  '7,4,9,5,11,17,23,2,0,14,21,24,10,16,13,6,15,25,12,22,18,20,8,19,3,26,1',
  '',
  '22 13 17 11  0',
  ' 8  2 23  4 24',
  '21  9 14 16  7',
  ' 6 10  3 18  5',
  ' 1 12 20 15 19',
  '',
  ' 3 15  0  2 22',
  ' 9 18 13 17  5',
  '19  8  7 25 23',
  '20 11 10 24  4',
  '14 21 16 12  6',
  '',
  '14 21 17 24  4',
  '10 16 15  9 19',
  '18  8 23 26 20',
  '22 11 13  6  5',
  ' 2  0 12  3  7',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2021,
    day: 4,
    part: 1,
    title: 'Giant Squid',
    puzzleUrl: 'https://adventofcode.com/2021/day/4',
    summary: 'Simulate 5x5 Bingo boards against a draw sequence and score the first board to complete a row or column.',
    algorithmSummary:
      'Map draws to first-occurrence indices, evaluate each board via minimax over 5 rows and 5 columns, select the earliest winner via FIRST_WINNER_POLICY, and multiply its BigInt unmarked sum by the winning draw.',
    complexity: 'O(D + B * 25) time, O(D + B * 25) space',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '4512',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: Part1Visualizer,
};
