import { createElement } from 'react';
import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { DEFAULT_RAM_RUN_CONFIG, EXAMPLE_RAM_RUN_CONFIG, type MemorySpace } from '../shared';
import { createRamRunPart2Solver, solvePart2 } from './domain';
import { RamRunPart2Visualizer } from './viz/RamRunPart2Visualizer';

const EXAMPLE_INPUT = [
  '5,4', '4,2', '4,5', '3,0', '2,1',
  '6,3', '2,4', '1,5', '0,6', '3,3',
  '2,6', '5,1', '1,2', '5,5', '2,5',
  '6,5', '1,4', '0,4', '6,4', '1,1',
  '6,1', '1,0', '0,5', '1,6', '2,0',
].join('\n');

function selectGridSizeForInput(raw: string): number {
  const normalized = raw.replace(/\r\n/g, '\n').trim();
  return normalized === EXAMPLE_INPUT ? EXAMPLE_RAM_RUN_CONFIG.gridSize : DEFAULT_RAM_RUN_CONFIG.gridSize;
}

const manifestSolver: PuzzleSolver<MemorySpace, string> = {
  parse: (raw) => createRamRunPart2Solver(selectGridSizeForInput(raw)).parse(raw),
  solve: solvePart2,
};

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2024,
    day: 18,
    part: 2,
    title: 'RAM Run',
    puzzleUrl: 'https://adventofcode.com/2024/day/18#part2',
    summary:
      'Find the coordinates of the first falling byte that cuts off every path from (0, 0) to the bottom-right exit.',
    algorithmSummary:
      'Use reverse-time Disjoint Set Union: start from the final grid after all bytes fall, reopen cells backward by earliest corruption index, and report the last byte that restores (0, 0) to (S - 1, S - 1) connectivity.',
    complexity: 'O(S^2 + B * alpha(S^2)) time and O(S^2 + B) space for grid side S and B byte coordinates',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '6,1',
  solver: manifestSolver as PuzzleSolver<unknown, unknown>,
  Visualizer: ({ rawInput }) =>
    createElement(RamRunPart2Visualizer, {
      rawInput,
      gridSize: selectGridSizeForInput(rawInput),
    }),
};
