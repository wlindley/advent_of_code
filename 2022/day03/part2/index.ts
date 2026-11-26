import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { ElfGroupBadgeVisualizer } from './viz/ElfGroupBadgeVisualizer';

const EXAMPLE_INPUT = [
  'vJrwpWtwJgWrhcsFMMfFFhFp',
  'jqHRNqRjqzjGDLGLrsFMfFZSrLrFZsSL',
  'PmmdzqPrVvPwwTWBwg',
  'wMqvLMZHhHMvwLHjbvcjnnSBnvTQFn',
  'ttgJtRGJQctTZtZT',
  'CrZsJsPPZsGzwwsLwLmpwMDw',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2022,
    day: 3,
    part: 2,
    title: 'Rucksack Reorganization',
    puzzleUrl: 'https://adventofcode.com/2022/day/3#part2',
    summary: 'Find the single badge item type shared by every 3-elf group and sum its priority (a-z: 1-26, A-Z: 27-52).',
    algorithmSummary:
      'Encode each rucksack into a 52-bit BigInt mask, intersect 3 consecutive elves with bitwise AND, and extract the badge priority via bigintLog2.',
    complexity: 'O(N * L) time, O(1) space per group',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '70',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: ElfGroupBadgeVisualizer,
};
