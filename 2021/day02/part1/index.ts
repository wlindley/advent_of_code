import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Part1Visualizer } from './viz/Part1Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2021,
    day: 2,
    part: 1,
    title: 'Dive!',
    puzzleUrl: 'https://adventofcode.com/2021/day/2',
    summary: 'Simulate horizontal and vertical submarine commands and multiply the final horizontal position by depth.',
    algorithmSummary:
      'Parse commands into an immutable SubmarineCourse and fold SubmarinePose.ORIGIN using DIRECT_NAVIGATION_POLICY in a single O(N) pass.',
    complexity: 'O(N) time, O(N) parsed storage (O(1) simulation state)',
  },
  exampleInput: 'forward 5\ndown 5\nforward 8\nup 3\ndown 8\nforward 2',
  exampleAnswer: '150',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: Part1Visualizer,
};
