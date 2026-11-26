import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { LensLibraryPart2Visualizer } from './viz/LensLibraryPart2Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2023,
    day: 15,
    part: 2,
    title: 'Lens Library',
    puzzleUrl: 'https://adventofcode.com/2023/day/15#part2',
    summary:
      'Execute the HASHMAP initialization sequence across 256 ordered lens boxes and sum the resulting focusing power.',
    algorithmSummary:
      'Parse label- and label=focal tokens, hash each label into boxes 0..255 backed by insertion-ordered Maps, and sum (box + 1) * slot * focalLength.',
    complexity: 'O(N) average time, O(L) space',
  },
  exampleInput: 'rn=1,cm-,qp=3,cm=2,qp-,pc=4,ot=9,ab=5,pc-,pc=6,ot=7',
  exampleAnswer: '145',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: LensLibraryPart2Visualizer,
};
