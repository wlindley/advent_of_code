import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { DiskPart1Visualizer } from './viz/DiskPart1Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2024,
    day: 9,
    part: 1,
    title: 'Disk Fragmenter',
    puzzleUrl: 'https://adventofcode.com/2024/day/9',
    summary:
      'Compact fragmented disk blocks one extent slice at a time from the rightmost file into the leftmost free space and compute the position-weighted BigInt checksum.',
    algorithmSummary:
      'Parse dense digit runs into an immutable DiskMap of FileExtent and FreeSpan intervals, plan O(F) two-pointer leftward CompactionMove slices, and sum BigInt checksum deltas.',
    complexity: 'O(N) parse & O(F) compaction time, O(F) extent space',
  },
  exampleInput: '2333133121414131402',
  exampleAnswer: '1928',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: DiskPart1Visualizer,
};
