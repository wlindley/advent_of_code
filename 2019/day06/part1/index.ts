import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Visualizer } from './viz/Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2019,
    day: 6,
    part: 1,
    title: 'Universal Orbit Map',
    puzzleUrl: 'https://adventofcode.com/2019/day/6',
    summary:
      'Count all direct and indirect orbital relationships across a rooted tree anchored at COM.',
    algorithmSummary:
      'Validate the single-parent orbit graph via BFS from COM into flat CSR/depth arrays and sum every object depth.',
    complexity: 'O(N) time and O(N) memory for N orbiting objects',
  },
  exampleInput: 'COM)B\nB)C\nC)D\nD)E\nE)F\nB)G\nG)H\nD)I\nE)J\nJ)K\nK)L',
  exampleAnswer: '42',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer,
};
