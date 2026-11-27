import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { MemoryGamePart2Visualizer } from './viz/MemoryGamePart2Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2020,
    day: 15,
    part: 2,
    title: 'Rambunctious Recitation',
    puzzleUrl: 'https://adventofcode.com/2020/day/15#part2',
    summary:
      'Extend the turn-by-turn memory game to 30,000,000 turns using the same unseen-yields-0 and repeat-yields-age rule.',
    algorithmSummary:
      'Parse seeds into a StartingSequence and simulate 30M turns with a Commit-on-Speak LastSeenTable (Uint32Array fast path plus Map overflow).',
    complexity: 'O(N) time and O(N) space over N = 30,000,000 turns',
  },
  exampleInput: '0,3,6',
  exampleAnswer: '175594',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: MemoryGamePart2Visualizer,
};
