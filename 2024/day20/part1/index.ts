import { createElement } from 'react';
import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { type Racetrack, parseRacetrack } from '../shared';
import { solvePart1 } from './domain';
import {
  PART1_EXAMPLE_INPUT,
  RaceConditionPart1Visualizer,
  selectPart1Config,
} from './viz/RaceConditionPart1Visualizer';

const manifestSolver: PuzzleSolver<{ readonly racetrack: Racetrack; readonly minSaving: number }, number> = {
  parse: (raw) => ({
    racetrack: parseRacetrack(raw),
    minSaving: selectPart1Config(raw).minSaving,
  }),
  solve: ({ racetrack, minSaving }) => solvePart1(racetrack, minSaving),
};

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2024,
    day: 20,
    part: 1,
    title: 'Race Condition',
    puzzleUrl: 'https://adventofcode.com/2024/day/20',
    summary:
      'Count single 2-picosecond cheats through walls that reduce the shortest S-to-E racetrack time by at least 100 picoseconds.',
    algorithmSummary:
      'Run two flat Int32Array BFS passes from S and E, then scan reachable cells within Manhattan radius 2 to tally savings >= threshold.',
    complexity: 'O(R * C * K^2) time and O(R * C) space for R x C grid and cheat span K = 2',
  },
  exampleInput: PART1_EXAMPLE_INPUT,
  exampleAnswer: '44',
  solver: manifestSolver as PuzzleSolver<unknown, unknown>,
  Visualizer: ({ rawInput }) => createElement(RaceConditionPart1Visualizer, { rawInput }),
};
