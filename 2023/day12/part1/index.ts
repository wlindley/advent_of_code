import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { HotSpringsPart1Visualizer } from './viz/HotSpringsPart1Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2023,
    day: 12,
    part: 1,
    title: 'Hot Springs',
    puzzleUrl: 'https://adventofcode.com/2023/day/12',
    summary:
      'Count valid arrangements of operational (.) and damaged (#) springs for each condition record matching its contiguous run-length specification.',
    algorithmSummary:
      'Suffix dynamic programming over (groupIndex, patternIndex) with O(1) dot-prefix interval checks and exact BigInt accumulation.',
    complexity: 'O(L * G) time and O(L) rolling space per record',
  },
  exampleInput: [
    '???.### 1,1,3',
    '.??..??...?##. 1,1,3',
    '?#?#?#?#?#?#?#? 1,3,1,6',
    '????.#...#... 4,1,1',
    '????.######..#####. 1,6,5',
    '?###???????? 3,2,1',
  ].join('\n'),
  exampleAnswer: '21',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: HotSpringsPart1Visualizer,
};
