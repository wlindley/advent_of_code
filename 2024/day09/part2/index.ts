import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { DiskPart2Visualizer } from './viz/DiskPart2Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2024,
    day: 9,
    part: 2,
    title: 'Disk Fragmenter',
    puzzleUrl: 'https://adventofcode.com/2024/day/9#part2',
    summary:
      'Relocate each whole file at most once in descending file ID order into the leftmost contiguous free span before its start and compute the position-weighted BigInt checksum.',
    algorithmSummary:
      'Coalesce adjacent FreeSpan intervals, index span lengths in a binary max-segment tree (LeftmostSpanIndex), claim leftmost fitting spans in descending file ID order, and accumulate BigInt checksum deltas.',
    complexity: 'O(N) parse & O(F log S) compaction time, O(F + S) space',
  },
  exampleInput: '2333133121414131402',
  exampleAnswer: '2858',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: DiskPart2Visualizer,
};
