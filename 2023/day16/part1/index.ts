import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { LavaPart1Visualizer } from './viz/LavaPart1Visualizer';

const EXAMPLE_INPUT = [
  '.|...\\....',
  '|.-.\\.....',
  '.....|-...',
  '........|.',
  '..........',
  '.........\\',
  '..../.\\\\..',
  '.-.-/..|..',
  '.|....-|.\\',
  '..//.|....',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2023,
    day: 16,
    part: 1,
    title: 'The Floor Will Be Lava',
    puzzleUrl: 'https://adventofcode.com/2023/day/16',
    summary:
      'Trace a light beam entering the top-left tile heading East through mirrors and splitters, then count how many tiles become energized.',
    algorithmSummary:
      'Flat-queue wavefront BFS over (cell, direction) states with a 20-byte outgoing direction bitmask table and per-cell 4-bit visited deduplication.',
    complexity: 'O(H * W) time, O(H * W) space',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '46',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: LavaPart1Visualizer,
};
