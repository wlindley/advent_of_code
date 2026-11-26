import { createElement } from 'react';
import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import {
  type ImageDimensions,
  MIN_ZERO_CHECKSUM_POLICY,
  PART1_EXAMPLE_DIMENSIONS,
  SpaceImageSolver,
  STANDARD_IMAGE_DIMENSIONS,
} from '../shared';
import { Visualizer } from './viz/Visualizer';

const EXAMPLE_INPUT = '123456789012';

function selectDimensionsForInput(raw: string): ImageDimensions {
  return raw.trim() === EXAMPLE_INPUT ? PART1_EXAMPLE_DIMENSIONS : STANDARD_IMAGE_DIMENSIONS;
}

const manifestSolver = new SpaceImageSolver(MIN_ZERO_CHECKSUM_POLICY, selectDimensionsForInput);

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2019,
    day: 8,
    part: 1,
    title: 'Space Image Format',
    puzzleUrl: 'https://adventofcode.com/2019/day/8',
    summary:
      'Split a digit stream into fixed-dimension layers, locate the layer with the fewest zero digits, and multiply its one and two counts.',
    algorithmSummary:
      'Validate digit framing against layer area, tally 0/1/2 frequencies per layer, select the earliest minimum-zero layer, and compute ones * twos.',
    complexity: 'O(N) time, O(N) pixel buffer (O(L * W * H) trace snapshots bounded to 100 frames)',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '1',
  solver: manifestSolver as PuzzleSolver<unknown, unknown>,
  Visualizer: ({ rawInput }) => createElement(Visualizer, { rawInput, solver: manifestSolver }),
};
