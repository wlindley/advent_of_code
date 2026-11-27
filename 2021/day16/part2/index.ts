import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Part2Visualizer } from './viz/Part2Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2021,
    day: 16,
    part: 2,
    title: 'Packet Decoder',
    puzzleUrl: 'https://adventofcode.com/2021/day/16#part2',
    summary:
      'Decode a big-endian hexadecimal BITS transmission into an expression AST of literals and typed operators, then evaluate the root packet value.',
    algorithmSummary:
      'Parse validated hex nibbles into an immutable typed bitstream, decode recursive headers, 5-bit literal groups, and length-mode 0/1 sub-packets into a frozen BigInt AST, then post-order reduce operators 0–7.',
    complexity: 'O(B) time and O(P + B) space for B bits and P decoded packets',
  },
  exampleInput: '9C0141080250320F1802104A08',
  exampleAnswer: '1',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: Part2Visualizer,
};
