import { createElement } from 'react';
import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import type { Point3D } from '../shared';
import { PART1_PAIR_COUNT, connectClosestCircuits, solver } from './domain';
import { CircuitOrbitVisualizer } from './viz/CircuitOrbitVisualizer';

const EXAMPLE_INPUT = [
  '162,817,812', '57,618,57', '906,360,560', '592,479,940', '352,342,300',
  '466,668,158', '542,29,236', '431,825,988', '739,650,466', '52,470,668',
  '216,146,977', '819,987,18', '117,168,530', '805,96,715', '346,949,466',
  '970,615,88', '941,993,340', '862,61,35', '984,92,344', '425,690,689',
].join('\n');

const manifestSolver: PuzzleSolver<{ readonly points: readonly Point3D[]; readonly pairCount: number }, number> = {
  parse: (raw) => ({ points: solver.parse(raw), pairCount: raw === EXAMPLE_INPUT ? 10 : PART1_PAIR_COUNT }),
  solve: ({ points, pairCount }) => connectClosestCircuits(points, pairCount).answer,
};

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2025,
    day: 8,
    part: 1,
    title: 'Playground',
    puzzleUrl: 'https://adventofcode.com/2025/day/8',
    summary: 'Connect the closest 3D junction box pairs in order and multiply the sizes of the three largest circuits.',
    algorithmSummary:
      'Select the K closest pairs using a bounded binary max-heap on exact squared 3D distances, then merge components with a DisjointSet.',
    complexity: 'O(N^2 log K + K alpha(N)) time, O(N + K) space',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '40',
  solver: manifestSolver as PuzzleSolver<unknown, unknown>,
  Visualizer: ({ rawInput }) =>
    createElement(CircuitOrbitVisualizer, { rawInput, pairCount: rawInput === EXAMPLE_INPUT ? 10 : PART1_PAIR_COUNT }),
};
