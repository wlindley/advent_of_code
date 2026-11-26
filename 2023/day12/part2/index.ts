import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { HotSpringsPart2Visualizer } from './viz/HotSpringsPart2Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2023,
    day: 12,
    part: 2,
    title: 'Hot Springs',
    puzzleUrl: 'https://adventofcode.com/2023/day/12#part2',
    summary:
      'Unfold each spring condition record fivefold (joining patterns with ? and repeating group lists 5x) and count all valid arrangements.',
    algorithmSummary:
      'Suffix dynamic programming over (groupIndex, patternIndex) on 5x unfolded records with O(1) dot-prefix checks and exact BigInt accumulation.',
    complexity: 'O(L * G) time and O(L) rolling space per 5x unfolded record',
  },
  exampleInput: [
    '???.### 1,1,3',
    '.??..??...?##. 1,1,3',
    '?#?#?#?#?#?#?#? 1,3,1,6',
    '????.#...#... 4,1,1',
    '????.######..#####. 1,6,5',
    '?###???????? 3,2,1',
  ].join('\n'),
  exampleAnswer: '525152',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: HotSpringsPart2Visualizer,
};
