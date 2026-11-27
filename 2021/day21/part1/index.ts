import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Part1Visualizer } from './viz/Part1Visualizer';

const EXAMPLE_INPUT = [
  'Player 1 starting position: 4',
  'Player 2 starting position: 8',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2021,
    day: 21,
    part: 1,
    title: 'Dirac Dice',
    puzzleUrl: 'https://adventofcode.com/2021/day/21',
    summary:
      'Simulate a two-player practice game on a 10-space circular track with a deterministic 100-sided die until a player reaches 1000 points, then multiply losing score by total die rolls.',
    algorithmSummary:
      'Turn-based modular arithmetic around the 10-space ring with deterministic triplet die wraparound (1..100) and uniformly sampled turn snapshots for playback.',
    complexity: 'O(T) time and O(min(T, maxSteps)) trace space for T <= ~1000 turns',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '739785',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: Part1Visualizer,
};
