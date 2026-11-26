import { createElement } from 'react';
import type { PuzzleSolver, TraceOptions } from '../../../shared/core';
import type { PuzzlePartManifest, VisualizerProps } from '../../../shared/viz';
import {
  buildHailTrace2D,
  countFutureIntersections2D,
  type Hailstone,
  type HailTrace2DFrame,
  TestArea,
} from '../shared';
import { PERSONAL_TEST_AREA, solver } from './domain';
import { HailPart1Visualizer } from './viz/HailPart1Visualizer';

const EXAMPLE_INPUT = [
  '19, 13, 30 @ -2,  1, -2',
  '18, 19, 22 @ -1, -1, -2',
  '20, 25, 34 @ -2, -2, -4',
  '12, 31, 28 @ -1, -2, -1',
  '20, 19, 15 @  1, -5, -3',
].join('\n');

const EXAMPLE_TEST_AREA = new TestArea(7n, 27n);

interface Part1ManifestInput {
  readonly hailstones: readonly Hailstone[];
  readonly area: TestArea;
}

function resolvePart1Area(raw: string): TestArea {
  const normalized = raw.replace(/\r\n/g, '\n').replace(/\n+$/, '');
  return normalized === EXAMPLE_INPUT ? EXAMPLE_TEST_AREA : PERSONAL_TEST_AREA;
}

const manifestSolver: PuzzleSolver<Part1ManifestInput, number, HailTrace2DFrame> = {
  parse: (raw: string): Part1ManifestInput => ({
    hailstones: solver.parse(raw),
    area: resolvePart1Area(raw),
  }),
  solve: ({ hailstones, area }: Part1ManifestInput): number => countFutureIntersections2D(hailstones, area),
  trace: ({ hailstones, area }: Part1ManifestInput, options?: TraceOptions): readonly HailTrace2DFrame[] =>
    buildHailTrace2D(hailstones, area, options),
};

function Part1VisualizerEntry({ rawInput }: VisualizerProps) {
  return createElement(HailPart1Visualizer, { rawInput, area: resolvePart1Area(rawInput) });
}

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2023,
    day: 24,
    part: 1,
    title: 'Never Tell Me The Odds',
    puzzleUrl: 'https://adventofcode.com/2023/day/24',
    summary:
      'Count how many hailstone pairs have future 2D XY ray intersections inside the square test area.',
    algorithmSummary:
      'Solves 2x2 ray intersection systems using exact BigInt cross-product determinants, checks non-negative time numerators, and verifies square test-area containment without floating-point rounding.',
    complexity: 'O(N^2) time and O(N) auxiliary space for N hailstones',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '2',
  solver: manifestSolver as PuzzleSolver<unknown, unknown>,
  Visualizer: Part1VisualizerEntry,
};
