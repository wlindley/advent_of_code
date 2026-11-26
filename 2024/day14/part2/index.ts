import { createElement } from 'react';
import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { DEFAULT_REDOUBT_SPACE, type Robot, TorusSpace } from '../shared';
import { findEasterEggSecond, solver, traceEasterEggConvergence } from './domain';
import { RestroomRedoubtPart2Visualizer } from './viz/RestroomRedoubtPart2Visualizer';

export const SYNTHETIC_EXAMPLE_SPACE = new TorusSpace(15, 13);

export const SYNTHETIC_EXAMPLE_INPUT = [
  'p=10,0 v=-4,-4',
  'p=9,9 v=1,2',
  'p=13,7 v=7,-6',
  'p=2,5 v=-2,-1',
  'p=11,1 v=2,5',
  'p=0,12 v=-7,-3',
  'p=4,7 v=-1,3',
  'p=5,5 v=4,-5',
  'p=12,0 v=-4,1',
  'p=9,12 v=1,6',
  'p=13,10 v=7,-2',
  'p=2,5 v=-2,4',
  'p=11,4 v=2,-4',
  'p=0,12 v=-7,2',
  'p=4,10 v=-1,-6',
  'p=5,8 v=4,-1',
  'p=12,3 v=-4,5',
  'p=7,2 v=1,-3',
  'p=11,10 v=7,3',
  'p=0,8 v=-2,-5',
  'p=13,3 v=2,1',
  'p=2,1 v=-7,6',
  'p=6,12 v=-1,-2',
  'p=7,7 v=4,4',
  'p=8,6 v=-4,-4',
  'p=9,1 v=1,2',
  'p=13,12 v=7,-6',
  'p=2,10 v=-2,-1',
  'p=0,5 v=2,5',
  'p=13,4 v=-7,-3',
  'p=2,12 v=-1,3',
  'p=3,10 v=4,-5',
  'p=10,5 v=-4,1',
  'p=11,3 v=1,6',
  'p=0,1 v=7,-2',
  'p=4,9 v=-2,4',
  'p=13,8 v=2,-4',
].join('\n');

function normalizeInput(raw: string): string {
  return raw.replace(/\r\n/g, '\n').trim();
}

function selectSpaceForInput(raw: string): TorusSpace {
  return normalizeInput(raw) === SYNTHETIC_EXAMPLE_INPUT
    ? SYNTHETIC_EXAMPLE_SPACE
    : DEFAULT_REDOUBT_SPACE;
}

const manifestSolver: PuzzleSolver<{ readonly robots: readonly Robot[]; readonly space: TorusSpace }, number> = {
  parse: (raw) => ({ robots: solver.parse(raw), space: selectSpaceForInput(raw) }),
  solve: ({ robots, space }) => findEasterEggSecond(robots, space),
  trace: ({ robots, space }, options) => traceEasterEggConvergence(robots, space, options),
};

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2024,
    day: 14,
    part: 2,
    title: 'Restroom Redoubt',
    puzzleUrl: 'https://adventofcode.com/2024/day/14#part2',
    summary:
      'Find the earliest second at which the wrapping robots coalesce into a dense connected Christmas-tree cluster.',
    algorithmSummary:
      'Scan the full lcm(W, H) recurrence period using uint32 generation-stamped occupancy buffers and maximize orthogonal occupied neighbor pairs.',
    complexity: 'O(P * (N + U)) time, O(W * H + P) space',
  },
  exampleInput: SYNTHETIC_EXAMPLE_INPUT,
  exampleAnswer: '42',
  solver: manifestSolver as PuzzleSolver<unknown, unknown>,
  Visualizer: ({ rawInput }) =>
    createElement(RestroomRedoubtPart2Visualizer, {
      rawInput,
      space: selectSpaceForInput(rawInput),
    }),
};
