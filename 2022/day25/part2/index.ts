import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { StarSmoothieFinaleVisualizer } from './viz/StarSmoothieFinaleVisualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2022,
    day: 25,
    part: 2,
    title: 'Full of Hot Air',
    puzzleUrl: 'https://adventofcode.com/2022/day/25#part2',
    summary:
      'Advent of Code 2022 finale star: blend all 49 collected stars across Days 1–25 into a star smoothie for the reindeer to claim the 50th and final star.',
    algorithmSummary:
      'Verifies all 49 prerequisite stars are collected and submits the AoC Day 25 finale completion trigger (level=2, answer=0), paired with an interactive 50-star canopy illumination.',
    complexity: 'O(1) verification, O(S) illumination trace',
  },
  exampleInput: '49',
  exampleAnswer: '0',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: StarSmoothieFinaleVisualizer,
};
