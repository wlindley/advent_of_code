import { createElement } from 'react';
import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import {
  DEFAULT_REDOUBT_SPACE,
  EXAMPLE_REDOUBT_SPACE,
  type Robot,
  type TorusSpace,
  evaluateSafetyFactor,
} from '../shared';
import { PART1_SECONDS, solver } from './domain';
import { RestroomRedoubtPart1Visualizer } from './viz/RestroomRedoubtPart1Visualizer';

const EXAMPLE_INPUT = [
  'p=0,4 v=3,-3',
  'p=6,3 v=-1,-3',
  'p=10,3 v=-1,2',
  'p=2,0 v=2,-1',
  'p=0,0 v=1,3',
  'p=3,0 v=-2,-2',
  'p=7,6 v=-1,-3',
  'p=3,0 v=-1,-2',
  'p=9,3 v=2,3',
  'p=7,3 v=-1,2',
  'p=2,4 v=2,-3',
  'p=9,5 v=-3,-3',
].join('\n');

function normalizeInput(raw: string): string {
  return raw.replace(/\r\n/g, '\n').trim();
}

function selectSpaceForInput(raw: string): TorusSpace {
  return normalizeInput(raw) === EXAMPLE_INPUT ? EXAMPLE_REDOUBT_SPACE : DEFAULT_REDOUBT_SPACE;
}

const manifestSolver: PuzzleSolver<{ readonly robots: readonly Robot[]; readonly space: TorusSpace }, number> = {
  parse: (raw) => ({ robots: solver.parse(raw), space: selectSpaceForInput(raw) }),
  solve: ({ robots, space }) => evaluateSafetyFactor(robots, space, PART1_SECONDS),
};

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2024,
    day: 14,
    part: 1,
    title: 'Restroom Redoubt',
    puzzleUrl: 'https://adventofcode.com/2024/day/14',
    summary:
      'Simulate wrapping robots on an odd-dimensioned grid for 100 seconds and multiply the robot counts in the four midline-separated quadrants.',
    algorithmSummary:
      'Compute each robot’s wrapped coordinate in O(1) via Euclidean modular arithmetic, discard robots on the center crosshair, and multiply the four quadrant totals.',
    complexity: 'O(N) time, O(1) solve space (O(W * H) per trace frame)',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '12',
  solver: manifestSolver as PuzzleSolver<unknown, unknown>,
  Visualizer: ({ rawInput }) =>
    createElement(RestroomRedoubtPart1Visualizer, {
      rawInput,
      space: selectSpaceForInput(rawInput),
    }),
};
