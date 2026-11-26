import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { LensLibraryPart1Visualizer } from './viz/LensLibraryPart1Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2023,
    day: 15,
    part: 1,
    title: 'Lens Library',
    puzzleUrl: 'https://adventofcode.com/2023/day/15',
    summary:
      'Compute the 8-bit HASH value of each comma-separated initialization step and sum the results across the sequence.',
    algorithmSummary:
      'Strip line breaks, split on commas, and accumulate ((h + ascii) * 17) & 255 over each token in a single linear pass.',
    complexity: 'O(N) time, O(N) space',
  },
  exampleInput: 'rn=1,cm-,qp=3,cm=2,qp-,pc=4,ot=9,ab=5,pc-,pc=6,ot=7',
  exampleAnswer: '1320',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: LensLibraryPart1Visualizer,
};
