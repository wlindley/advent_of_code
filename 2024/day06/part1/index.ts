import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { GuardPatrolVisualizer } from './viz/GuardPatrolVisualizer';

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
    part: 1,
    title: 'Guard Gallivant',
    puzzleUrl: 'https://adventofcode.com/2024/day/6',
    summary: 'Count distinct grid positions visited by a patrolling guard before leaving the mapped lab.',
    algorithmSummary:
      'Parse the lab floorplan into a frozen LabMap, step along DIRS_4 turning 90° clockwise before obstacles, and track (cell, dir) bits in a flat Uint8Array.',
    complexity: 'O(R * C) bounded state steps across R x C grid cells, O(R * C) space',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '41',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: GuardPatrolVisualizer,
};
