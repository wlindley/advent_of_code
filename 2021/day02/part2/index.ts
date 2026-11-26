import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Part2Visualizer } from './viz/Part2Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2021,
    day: 2,
    part: 2,
    title: 'Dive!',
    puzzleUrl: 'https://adventofcode.com/2021/day/2#part2',
    summary: 'Steer submarine aim with vertical commands, advance depth by aim * units on forward, and multiply final position by depth.',
    algorithmSummary:
      'Parse commands into an immutable SubmarineCourse and fold SubmarinePose.ORIGIN using AIM_NAVIGATION_POLICY in a single O(N) pass.',
    complexity: 'O(N) time, O(N) parsed storage (O(1) simulation state)',
  },
  exampleInput: 'forward 5\ndown 5\nforward 8\nup 3\ndown 8\nforward 2',
  exampleAnswer: '900',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: Part2Visualizer,
};
