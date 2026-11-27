import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { EXAMPLE_SPRINGDROID_PROGRAM } from '../shared';
import { solver } from './domain';
import { Visualizer } from './viz/Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2019,
    day: 21,
    part: 1,
    title: 'Springdroid Adventure',
    puzzleUrl: 'https://adventofcode.com/2019/day/21',
    summary:
      'Program an Intcode springdroid in WALK mode using four lookahead hull sensors (A–D) to jump over gaps without falling into space and measure hull damage.',
    algorithmSummary:
      'Encode J = !(A && B && C) && D in five Springscript instructions, execute the Intcode VM via an O(1) ASCII/damage I/O channel, and extract the non-ASCII hull damage value.',
    complexity: 'O(I) time for I Intcode VM execution steps with <= 15 Springscript instructions',
  },
  exampleInput: EXAMPLE_SPRINGDROID_PROGRAM,
  exampleAnswer: '19354',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer,
};
