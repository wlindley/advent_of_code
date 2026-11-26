import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import {
  CrossedWiresPart1Visualizer,
  PART1_EXAMPLE_INPUT,
} from './viz/CrossedWiresPart1Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2024,
    day: 24,
    part: 1,
    title: 'Crossed Wires',
    puzzleUrl: 'https://adventofcode.com/2024/day/24',
    summary:
      'Simulate a combinational boolean gate network from initial x/y wire bits and assemble the z* output wires into an unsigned integer.',
    algorithmSummary:
      'Build the wire-dependency DAG, topologically sort with Kahn’s algorithm to reject cycles and settle gates in dependency order, and bit-shift zNN wires into a BigInt.',
    complexity: 'O(V + E) time and O(V + E) space for V wires and E gate-input edges',
  },
  exampleInput: PART1_EXAMPLE_INPUT,
  exampleAnswer: '2024',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: CrossedWiresPart1Visualizer,
};
