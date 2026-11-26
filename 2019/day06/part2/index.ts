import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Visualizer } from './viz/Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2019,
    day: 6,
    part: 2,
    title: 'Universal Orbit Map',
    puzzleUrl: 'https://adventofcode.com/2019/day/6#part2',
    summary:
      'Compute minimum orbital transfers between the objects orbited by YOU and SAN via their lowest common ancestor.',
    algorithmSummary:
      'Ascend both parent pointers to equal depth, then climb in lockstep to the LCA to assemble the unique shortest transfer path.',
    complexity: 'O(N) time and O(N) memory for N orbiting objects',
  },
  exampleInput:
    'COM)B\nB)C\nC)D\nD)E\nE)F\nB)G\nG)H\nD)I\nE)J\nJ)K\nK)L\nK)YOU\nI)SAN',
  exampleAnswer: '4',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer,
};
