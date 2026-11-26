import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { PART2_EXAMPLE_ANSWER, PART2_EXAMPLE_INPUT, solver } from './domain';
import { Visualizer } from './viz/Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2019,
    day: 2,
    part: 2,
    title: '1202 Program Alarm',
    puzzleUrl: 'https://adventofcode.com/2019/day/2#part2',
    summary: 'Search noun and verb in [0, 99] producing mem[0] = 19690720 and return 100 * noun + verb.',
    algorithmSummary:
      'Probe (0,0), (1,0), and (0,1) to infer and verify the affine model C + A*noun + B*verb = 19690720, falling back to cached exhaustive search when non-affine.',
    complexity: 'O(N + M*S) affine fast path (typically 4 runs) or O(M^2 * S) cached fallback for M = 100',
  },
  exampleInput: PART2_EXAMPLE_INPUT,
  exampleAnswer: PART2_EXAMPLE_ANSWER,
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer,
};
