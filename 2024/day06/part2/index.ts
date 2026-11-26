import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { LoopObstructionsVisualizer } from './viz/LoopObstructionsVisualizer';

const EXAMPLE_INPUT = [
  '....#.....',
  '.........#',
  '..........',
  '..#.......',
  '.......#..',
  '..........',
  '.#..^.....',
  '........#.',
  '#.........',
  '......#...',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2024,
    day: 6,
    part: 2,
    title: 'Guard Gallivant',
    puzzleUrl: 'https://adventofcode.com/2024/day/6#part2',
    summary: 'Count distinct non-start grid positions where adding one obstacle traps the patrolling guard in a loop.',
    algorithmSummary:
      'Precompute four directional jump tables on the LabMap, resolve candidate extra-obstacle ray interceptions in O(1), and detect turn-state cycles using generation-stamped Uint32Array markers.',
    complexity: 'O(R * C + K * T) across K candidate cells and T turn jumps per candidate, O(R * C) space',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '6',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: LoopObstructionsVisualizer,
};
