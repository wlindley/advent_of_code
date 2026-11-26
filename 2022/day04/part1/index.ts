import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { SectionRangeVisualizer } from './viz/SectionRangeVisualizer';

const EXAMPLE_INPUT = [
  '2-4,6-8',
  '2-3,4-5',
  '5-7,7-9',
  '2-8,3-7',
  '6-6,4-6',
  '2-6,4-8',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2022,
    day: 4,
    part: 1,
    title: 'Camp Cleanup',
    puzzleUrl: 'https://adventofcode.com/2022/day/4',
    summary: 'Count how many Elf assignment pairs have one closed section range fully containing the other.',
    algorithmSummary:
      'Parse each pair into immutable BigInt ClosedInterval objects and test bidirectional interval containment in O(1) per pair, O(N) total time.',
    complexity: 'O(N) time, O(1) auxiliary space',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '2',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: SectionRangeVisualizer,
};
