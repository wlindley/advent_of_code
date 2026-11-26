import { createElement } from 'react';
import type { PuzzleSolver, TraceOptions } from '../../../shared/core';
import type { PuzzlePartManifest, VisualizerProps } from '../../../shared/viz';
import { buildGardenTrace, type GardenMap, type GardenTraceFrame } from '../shared';
import { countInfinitePlotsForSteps, PART2_STEPS, solver } from './domain';
import { GardenPart2Visualizer } from './viz/GardenPart2Visualizer';

const EXAMPLE_INPUT = [
  '...........',
  '.....###.#.',
  '.###.##..#.',
  '..#.#...#..',
  '....#.#....',
  '.##..S####.',
  '.##..#...#.',
  '.......##..',
  '.##.#.####.',
  '.##..##.##.',
  '...........',
].join('\n');

const PART2_EXAMPLE_STEPS = 50n;

interface Part2ManifestInput {
  readonly map: GardenMap;
  readonly steps: bigint;
}

function resolvePart2Steps(raw: string): bigint {
  const normalized = raw.replace(/\r\n/g, '\n').replace(/\n+$/, '');
  return normalized === EXAMPLE_INPUT ? PART2_EXAMPLE_STEPS : PART2_STEPS;
}

const manifestSolver: PuzzleSolver<Part2ManifestInput, bigint, GardenTraceFrame> = {
  parse: (raw: string): Part2ManifestInput => ({
    map: solver.parse(raw),
    steps: resolvePart2Steps(raw),
  }),
  solve: ({ map, steps }: Part2ManifestInput): bigint => countInfinitePlotsForSteps(map, steps),
  trace: ({ map }: Part2ManifestInput, options?: TraceOptions): readonly GardenTraceFrame[] =>
    buildGardenTrace(map, Math.max(map.width, map.height), options),
};

function Part2VisualizerEntry({ rawInput }: VisualizerProps) {
  return createElement(GardenPart2Visualizer, {
    rawInput,
    steps: resolvePart2Steps(rawInput),
  });
}

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2023,
    day: 21,
    part: 2,
    title: 'Step Counter',
    puzzleUrl: 'https://adventofcode.com/2023/day/21#part2',
    summary:
      'Count how many garden plots the Elf can reach from S in exactly 26,501,365 orthogonal steps on an infinitely tiled garden grid.',
    algorithmSummary:
      'Samples exact infinite-grid BFS counts at r, r+N, r+2N, and verifies stabilization at r+3N before evaluating the exact bigint Newton forward-difference quadratic at quotient k = (steps - r) / N; falls back to bounded infinite BFS for small step counts.',
    complexity: 'O(N^2) time and O(N^2) space for 4 bounded tile-radius BFS samples when periodic-ready',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '1594',
  solver: manifestSolver as PuzzleSolver<unknown, unknown>,
  Visualizer: Part2VisualizerEntry,
};
