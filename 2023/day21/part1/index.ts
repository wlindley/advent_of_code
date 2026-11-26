import { createElement } from 'react';
import type { PuzzleSolver, TraceOptions } from '../../../shared/core';
import type { PuzzlePartManifest, VisualizerProps } from '../../../shared/viz';
import { buildGardenTrace, countFiniteReachable, type GardenMap, type GardenTraceFrame } from '../shared';
import { PART1_STEPS, solver } from './domain';
import { GardenPart1Visualizer } from './viz/GardenPart1Visualizer';

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

const PART1_EXAMPLE_STEPS = 6;

interface Part1ManifestInput {
  readonly map: GardenMap;
  readonly steps: number;
}

function resolvePart1Steps(raw: string): number {
  const normalized = raw.replace(/\r\n/g, '\n').replace(/\n+$/, '');
  return normalized === EXAMPLE_INPUT ? PART1_EXAMPLE_STEPS : PART1_STEPS;
}

const manifestSolver: PuzzleSolver<Part1ManifestInput, number, GardenTraceFrame> = {
  parse: (raw: string): Part1ManifestInput => ({
    map: solver.parse(raw),
    steps: resolvePart1Steps(raw),
  }),
  solve: ({ map, steps }: Part1ManifestInput): number => countFiniteReachable(map, steps),
  trace: ({ map, steps }: Part1ManifestInput, options?: TraceOptions): readonly GardenTraceFrame[] =>
    buildGardenTrace(map, steps, options),
};

function Part1VisualizerEntry({ rawInput }: VisualizerProps) {
  return createElement(GardenPart1Visualizer, {
    rawInput,
    steps: resolvePart1Steps(rawInput),
  });
}

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2023,
    day: 21,
    part: 1,
    title: 'Step Counter',
    puzzleUrl: 'https://adventofcode.com/2023/day/21',
    summary:
      'Count how many garden plots the Elf can reach from S in exactly 64 orthogonal steps on the bounded grid.',
    algorithmSummary:
      'Bounded BFS from S records shortest parity-preserving plot distances; plots at distance d <= 64 matching target parity are reachable when S has at least one open neighbor.',
    complexity: 'O(W * H) time and O(W * H) space for a W x H garden grid',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '16',
  solver: manifestSolver as PuzzleSolver<unknown, unknown>,
  Visualizer: Part1VisualizerEntry,
};
