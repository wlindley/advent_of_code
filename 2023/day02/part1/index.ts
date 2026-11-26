import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { CubeConundrumVisualizer } from './viz/CubeConundrumVisualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2023,
    day: 2,
    part: 1,
    title: 'Cube Conundrum',
    puzzleUrl: 'https://adventofcode.com/2023/day/2',
    summary:
      'Identify which games could have been played with at most 12 red, 13 green, and 14 blue cubes and sum their game IDs.',
    algorithmSummary:
      'Take the component-wise maximum across each game’s reveals to form its minimum required bag, then verify every color fits within (12, 13, 14) and sum feasible game IDs.',
    complexity: 'O(R) total reveals time, O(1) auxiliary space per game',
  },
  exampleInput: [
    'Game 1: 3 blue, 4 red; 1 red, 2 green, 6 blue; 2 green',
    'Game 2: 1 blue, 2 green; 3 green, 4 blue, 1 red; 1 green, 1 blue',
    'Game 3: 8 green, 6 blue, 20 red; 5 blue, 4 red, 13 green; 5 green, 1 red',
    'Game 4: 1 green, 3 red, 6 blue; 3 green, 6 red; 3 green, 15 blue, 14 red',
    'Game 5: 6 red, 1 blue, 3 green; 2 blue, 1 red, 2 green',
  ].join('\n'),
  exampleAnswer: '8',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: CubeConundrumVisualizer,
};
