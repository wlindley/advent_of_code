import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { PasswordPhilosophyPart1Visualizer } from './viz/PasswordPhilosophyPart1Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2020,
    day: 2,
    part: 1,
    title: 'Password Philosophy',
    puzzleUrl: 'https://adventofcode.com/2020/day/2',
    summary: 'Count how many passwords contain their policy letter within the specified min-max occurrence range.',
    algorithmSummary: 'Parse each policy entry and linearly count matching characters across each password.',
    complexity: 'O(N * L) time, O(N * L) input storage',
  },
  exampleInput: '1-3 a: abcde\n1-3 b: cdefg\n2-9 c: ccccccccc',
  exampleAnswer: '2',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: PasswordPhilosophyPart1Visualizer,
};
