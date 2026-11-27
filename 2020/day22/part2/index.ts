import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { CrabCombatPart2Visualizer } from './viz/CrabCombatPart2Visualizer';

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
    part: 2,
    title: 'Crab Combat',
    puzzleUrl: 'https://adventofcode.com/2020/day/22#part2',
    summary:
      'Simulate Recursive Combat with loop-detection and sub-game branching when drawn values do not exceed remaining deck counts, then score the winning deck.',
    algorithmSummary:
      'Use Int32Array circular buffers with FNV-1a state hashing for cycle termination and the sub-game pigeonhole shortcut when Player 1 holds the highest card.',
    complexity: 'O(R) time with O(S) seen-state memory across simulated rounds and sub-games',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '291',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: CrabCombatPart2Visualizer,
};
