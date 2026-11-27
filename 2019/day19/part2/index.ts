import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { EXAMPLE_BEAM_PROGRAM } from '../shared';
import { solver } from './domain';
import { Visualizer } from './viz/Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2019,
    day: 19,
    part: 2,
    title: 'Tractor Beam',
    puzzleUrl: 'https://adventofcode.com/2019/day/19#part2',
    summary:
      'Locate the closest 100x100 square fully contained inside the Intcode tractor beam and compute its encoded top-left coordinate.',
    algorithmSummary:
      'Exponentially jump down the beam left boundary with a safe -3 gap check, then monotonically walk rows testing top-right corner containment via memoized Intcode VM probes.',
    complexity: 'O(log Y + deltaY) Intcode VM probes and O(log Y + deltaY) boundary steps with O(1) extra search state',
  },
  exampleInput: EXAMPLE_BEAM_PROGRAM,
  exampleAnswer: '2810228',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer,
};
