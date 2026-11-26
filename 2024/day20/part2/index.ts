import { createElement } from 'react';
import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { type Racetrack, parseRacetrack } from '../shared';
import { solvePart2 } from './domain';
import {
  PART2_EXAMPLE_INPUT,
  RaceConditionPart2Visualizer,
  selectPart2Config,
} from './viz/RaceConditionPart2Visualizer';

const manifestSolver: PuzzleSolver<{ readonly racetrack: Racetrack; readonly minSaving: number }, number> = {
  parse: (raw) => ({
    racetrack: parseRacetrack(raw),
    minSaving: selectPart2Config(raw).minSaving,
  }),
  solve: ({ racetrack, minSaving }) => solvePart2(racetrack, minSaving),
};

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2024,
    day: 20,
    part: 2,
    title: 'Race Condition',
    puzzleUrl: 'https://adventofcode.com/2024/day/20#part2',
    summary:
      'Count single cheats up to 20 picoseconds through walls that reduce the shortest S-to-E racetrack time by at least 100 picoseconds.',
    algorithmSummary:
      'Run two flat Int32Array BFS passes from S and E, then scan reachable cells within Manhattan radius 20 to tally savings >= threshold.',
    complexity: 'O(R * C * K^2) time and O(R * C) space for R x C grid and cheat span K = 20',
  },
  exampleInput: PART2_EXAMPLE_INPUT,
  exampleAnswer: '285',
  solver: manifestSolver as PuzzleSolver<unknown, unknown>,
  Visualizer: ({ rawInput }) => createElement(RaceConditionPart2Visualizer, { rawInput }),
};
