import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { PulsePart1Visualizer } from './viz/PulsePart1Visualizer';

const EXAMPLE_INPUT = [
  'broadcaster -> a, b, c',
  '%a -> b',
  '%b -> c',
  '%c -> inv',
  '&inv -> a',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2023,
    day: 20,
    part: 1,
    title: 'Pulse Propagation',
    puzzleUrl: 'https://adventofcode.com/2023/day/20',
    summary:
      'Simulate 1,000 button presses across broadcaster, flip-flop, and conjunction modules in FIFO order and multiply total low and high pulses.',
    algorithmSummary:
      'Index-pointer FIFO queue simulation over polymorphic CircuitNode entities with per-press state retention and exact bigint pulse product.',
    complexity: 'O(P * (V + E)) time and O(V + E) space for P button presses and circuit graph (V, E)',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '32000000',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: PulsePart1Visualizer,
};
