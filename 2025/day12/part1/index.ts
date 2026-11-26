import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { TreeFarmVisualizer } from './viz/TreeFarmVisualizer';

const EXAMPLE_INPUT = [
  '0:', '###', '##.', '##.', '', '1:', '###', '##.', '.##', '',
  '2:', '.##', '###', '##.', '', '3:', '##.', '###', '##.', '',
  '4:', '###', '#..', '###', '', '5:', '###', '.#.', '###', '',
  '4x4: 0 0 0 0 2 0', '12x5: 1 0 1 0 2 2', '12x5: 1 0 1 0 3 2',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2025,
    day: 12,
    part: 1,
    title: 'Christmas Tree Farm',
    puzzleUrl: 'https://adventofcode.com/2025/day/12',
    summary: 'Count how many rectangular under-tree regions can pack their requested quantities of polyomino presents.',
    algorithmSummary:
      'Two-sided fast-path bounds (area overflow, bounding-box check, and disjoint box-tiling capacity) followed by transposed column-scanline BigInt bitboard DFS with dead-state memoization.',
    complexity: 'O(R · S) fast-path; O(cols · states) exact DFS',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '2',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: TreeFarmVisualizer,
};
