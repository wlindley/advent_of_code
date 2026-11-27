import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { MemoryGamePart1Visualizer } from './viz/MemoryGamePart1Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2020,
    day: 15,
    part: 1,
    title: 'Rambunctious Recitation',
    puzzleUrl: 'https://adventofcode.com/2020/day/15',
    summary:
      'Generate a turn-by-turn number sequence from starting seeds where unseen prior values yield 0 and repeats yield their turn age, returning the 2020th number.',
    algorithmSummary:
      'Parse seeds into a StartingSequence and simulate turns with a Commit-on-Speak LastSeenTable (Uint32Array fast path plus Map overflow).',
    complexity: 'O(N) time and O(N) space over N = 2020 turns',
  },
  exampleInput: '0,3,6',
  exampleAnswer: '436',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: MemoryGamePart1Visualizer,
};
