import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Part1Visualizer } from './viz/Part1Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2021,
    day: 16,
    part: 1,
    title: 'Packet Decoder',
    puzzleUrl: 'https://adventofcode.com/2021/day/16',
    summary:
      'Decode a big-endian hexadecimal BITS transmission containing nested literal and operator packets, then compute the sum of every packet version number.',
    algorithmSummary:
      'Parse validated hex nibbles into an immutable typed bitstream, recursively descend 3-bit headers, 5-bit continuation literal groups, and length-mode 0/1 sub-packets into a frozen BigInt AST, then sum versions across the tree.',
    complexity: 'O(B) time and O(P + B) space for B bits and P decoded packets',
  },
  exampleInput: 'A0016C880162017C3686B18A3D4780',
  exampleAnswer: '31',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: Part1Visualizer,
};
