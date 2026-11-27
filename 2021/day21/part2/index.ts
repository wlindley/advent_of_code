import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Part2Visualizer } from './viz/Part2Visualizer';

const EXAMPLE_INPUT = [
  'Player 1 starting position: 4',
  'Player 2 starting position: 8',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2021,
    day: 21,
    part: 2,
    title: 'Dirac Dice',
    puzzleUrl: 'https://adventofcode.com/2021/day/21#part2',
    summary:
      'Count all quantum universes in which each player reaches 21 points first under 27-way 3-sided die splits, and return the larger winning universe count.',
    algorithmSummary:
      'Round-by-round BigInt wavefront propagation over the 44,100-state active (pos1, pos2, score1, score2) lattice using the 7-sum Dirac roll distribution.',
    complexity: 'O(R * |active|) BigInt time and O(S^2 * T^2) space (S = 10, T = 21)',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '444356092776315',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: Part2Visualizer,
};
