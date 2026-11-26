import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import {
  LanPartyPart2Visualizer,
  PART2_EXAMPLE_INPUT,
} from './viz/LanPartyPart2Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2024,
    day: 23,
    part: 2,
    title: 'LAN Party',
    puzzleUrl: 'https://adventofcode.com/2024/day/23#part2',
    summary:
      'Find the largest set of mutually connected computers in the LAN link graph and join their sorted names as the party password.',
    algorithmSummary:
      'Canonicalize node names in sorted order, run pivoted Bron–Kerbosch across ordered roots with size-bound pruning, and break ties by lexicographical node-ID order.',
    complexity: 'O(V * d_max * 3^(d_max / 3)) worst-case time and O(V + E) space',
  },
  exampleInput: PART2_EXAMPLE_INPUT,
  exampleAnswer: 'co,de,ka,ta',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: LanPartyPart2Visualizer,
};
