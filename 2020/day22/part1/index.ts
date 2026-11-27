import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { CrabCombatPart1Visualizer } from './viz/CrabCombatPart1Visualizer';

const EXAMPLE_INPUT = [
  'Player 1:',
  '9',
  '2',
  '6',
  '3',
  '1',
  '',
  'Player 2:',
  '5',
  '8',
  '4',
  '7',
  '10',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2020,
    day: 22,
    part: 1,
    title: 'Crab Combat',
    puzzleUrl: 'https://adventofcode.com/2020/day/22',
    summary:
      'Simulate standard two-player card Combat round-by-round until one deck holds all cards, then compute the winning deck score.',
    algorithmSummary:
      'Maintain each player deck in a fixed-capacity Int32Array circular buffer for O(1) top-draw and bottom-push, then score via reverse-positional weights.',
    complexity: 'O(R) time with O(N) space for R simulated rounds and N total cards',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '306',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: CrabCombatPart1Visualizer,
};
