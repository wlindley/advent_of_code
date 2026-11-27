import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Visualizer } from './viz/Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2019,
    day: 16,
    part: 2,
    title: 'Flawed Frequency Transmission',
    puzzleUrl: 'https://adventofcode.com/2019/day/16#part2',
    summary:
      'Repeat the input signal 10,000 times, apply 100 FFT phases, and extract the 8 digits starting at the 7-digit prefix offset.',
    algorithmSummary:
      'Because the offset lies in the second half of the repeated signal, each phase reduces to an O(L - offset) backward suffix sum mod 10 over only the tail slice.',
    complexity: 'O(P * (L - offset)) time and O(L - offset) memory for repeated length L = 10,000N and P phases',
  },
  exampleInput: '03036732577212944063491565474664',
  exampleAnswer: '84462026',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer,
};
