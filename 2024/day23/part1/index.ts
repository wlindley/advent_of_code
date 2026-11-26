import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import {
  LanPartyPart1Visualizer,
  PART1_EXAMPLE_INPUT,
} from './viz/LanPartyPart1Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2024,
    day: 23,
    part: 1,
    title: 'LAN Party',
    puzzleUrl: 'https://adventofcode.com/2024/day/23',
    summary:
      'Count interconnected 3-computer sets (triangles) in the LAN link graph where at least one computer name starts with "t".',
    algorithmSummary:
      'Canonicalize node names in sorted order, store sorted adjacency lists, intersect upper-neighbor slices for u < v < w triangles, and filter by prefix "t".',
    complexity: 'O(E * d_max) time and O(V + E + T) space for V nodes, E edges, and T matching triangles',
  },
  exampleInput: PART1_EXAMPLE_INPUT,
  exampleAnswer: '7',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: LanPartyPart1Visualizer,
};
