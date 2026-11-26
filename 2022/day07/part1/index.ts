import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { DirectoryAuditVisualizer } from './viz/DirectoryAuditVisualizer';

const EXAMPLE_INPUT = [
  '$ cd /',
  '$ ls',
  'dir a',
  '14848514 b.txt',
  '8504156 c.dat',
  'dir d',
  '$ cd a',
  '$ ls',
  'dir e',
  '29116 f',
  '2557 g',
  '62596 h.lst',
  '$ cd e',
  '$ ls',
  '584 i',
  '$ cd ..',
  '$ cd ..',
  '$ cd d',
  '$ ls',
  '4060174 j',
  '8033020 d.log',
  '5626152 d.ext',
  '7214296 k',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2022,
    day: 7,
    part: 1,
    title: 'No Space Left On Device',
    puzzleUrl: 'https://adventofcode.com/2022/day/7',
    summary:
      'Reconstruct the directory tree from terminal commands and sum the total sizes of all directories at most 100,000 bytes.',
    algorithmSummary:
      'Build an immutable path-canonicalized directory tree via a path stack, then collect post-order DFS metrics in a single O(D + F) pass and sum directories with totalSize <= 100,000.',
    complexity: 'O(D + F) time, O(D + F) space',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '95437',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: DirectoryAuditVisualizer,
};
