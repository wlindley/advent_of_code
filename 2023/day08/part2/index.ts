import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Visualizer } from './viz/Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2023,
    day: 8,
    part: 2,
    title: 'Haunted Wasteland',
    puzzleUrl: 'https://adventofcode.com/2023/day/8#part2',
    summary:
      'Start a simultaneous ghost walk from every **A node following the cyclic L/R tape, and compute the earliest positive step where every ghost lands on a **Z node at once.',
    algorithmSummary:
      'Decompose each ghost walk into its (node, ip) rho-cycle (prefix μ, cycle c, **Z hits), check pre-cycle hits in [1, max μ), then fold steady-state modular congruences via generalized CRT.',
    complexity: 'O(G · V · L) cycle extraction + generalized CRT fold across ghost frontiers',
  },
  exampleInput: [
    'LR',
    '',
    '11A = (11B, XXX)',
    '11B = (XXX, 11Z)',
    '11Z = (11B, XXX)',
    '22A = (22B, XXX)',
    '22B = (22C, 22C)',
    '22C = (22Z, 22Z)',
    '22Z = (22B, 22B)',
    'XXX = (XXX, XXX)',
  ].join('\n'),
  exampleAnswer: '6',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer,
};
