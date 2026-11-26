import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { PasswordPhilosophyPart2Visualizer } from './viz/PasswordPhilosophyPart2Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2020,
    day: 2,
    part: 2,
    title: 'Password Philosophy',
    puzzleUrl: 'https://adventofcode.com/2020/day/2#part2',
    summary: 'Count how many passwords match their policy letter at exactly one of two 1-based positions.',
    algorithmSummary: 'Parse each policy entry and evaluate an XOR check on the two 1-based password indices.',
    complexity: 'O(N * L) parse & storage, O(N) solve',
  },
  exampleInput: '1-3 a: abcde\n1-3 b: cdefg\n2-9 c: ccccccccc',
  exampleAnswer: '1',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: PasswordPhilosophyPart2Visualizer,
};
