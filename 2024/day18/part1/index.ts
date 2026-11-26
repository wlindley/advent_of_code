import { createElement } from 'react';
import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import {
  DEFAULT_RAM_RUN_CONFIG,
  EXAMPLE_RAM_RUN_CONFIG,
  type MemorySpace,
  type RamRunConfig,
  parseMemorySpace,
} from '../shared';
import { solvePart1 } from './domain';
import { RamRunPart1Visualizer } from './viz/RamRunPart1Visualizer';

const EXAMPLE_INPUT = [
  '5,4', '4,2', '4,5', '3,0', '2,1',
  '6,3', '2,4', '1,5', '0,6', '3,3',
  '2,6', '5,1', '1,2', '5,5', '2,5',
  '6,5', '1,4', '0,4', '6,4', '1,1',
  '6,1', '1,0', '0,5', '1,6', '2,0',
].join('\n');

function normalizeInput(raw: string): string {
  return raw.replace(/\r\n/g, '\n').trim();
}

function selectConfigForInput(raw: string): RamRunConfig {
  return normalizeInput(raw) === EXAMPLE_INPUT ? EXAMPLE_RAM_RUN_CONFIG : DEFAULT_RAM_RUN_CONFIG;
}

const manifestSolver: PuzzleSolver<{ readonly memory: MemorySpace; readonly fallenCount: number }, number> = {
  parse: (raw) => {
    const config = selectConfigForInput(raw);
    return { memory: parseMemorySpace(raw, config.gridSize), fallenCount: config.fallenCount };
  },
  solve: ({ memory, fallenCount }) => solvePart1(memory, fallenCount),
};

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2024,
    day: 18,
    part: 1,
    title: 'RAM Run',
    puzzleUrl: 'https://adventofcode.com/2024/day/18',
    summary:
      'Find the minimum number of steps from (0, 0) to the bottom-right exit after the first batch of falling bytes corrupts memory coordinates.',
    algorithmSummary:
      'Record each cell’s earliest corruption index in a flat Int32Array grid and run 4-neighbor BFS from (0, 0) to (S - 1, S - 1) over cells safe after k fallen bytes.',
    complexity: 'O(S^2 + B) time and O(S^2) space for grid side S and B byte coordinates',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '22',
  solver: manifestSolver as PuzzleSolver<unknown, unknown>,
  Visualizer: ({ rawInput }) =>
    createElement(RamRunPart1Visualizer, {
      rawInput,
      config: selectConfigForInput(rawInput),
    }),
};
