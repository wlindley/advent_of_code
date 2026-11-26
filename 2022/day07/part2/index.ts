import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { DirectoryDeletionVisualizer } from './viz/DirectoryDeletionVisualizer';

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
    part: 2,
    title: 'No Space Left On Device',
    puzzleUrl: 'https://adventofcode.com/2022/day/7#part2',
    summary:
      'Compute the minimum bytes needed to reach 30,000,000 free on a 70,000,000-byte disk and find the smallest directory whose deletion meets that threshold.',
    algorithmSummary:
      'Reuse the immutable path-canonicalized filesystem tree and post-order DFS metrics in O(D + F) time, compute neededSpace from root totalSize, and select the minimum directory with totalSize >= neededSpace.',
    complexity: 'O(D + F) time, O(D + F) space',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '24933642',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: DirectoryDeletionVisualizer,
};
