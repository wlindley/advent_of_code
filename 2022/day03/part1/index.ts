import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { RucksackCompartmentVisualizer } from './viz/RucksackCompartmentVisualizer';

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
    part: 1,
    title: 'Rucksack Reorganization',
    puzzleUrl: 'https://adventofcode.com/2022/day/3',
    summary: 'Find the single item type present in both halves of each rucksack and sum its priority (a-z: 1-26, A-Z: 27-52).',
    algorithmSummary:
      'Encode each compartment into a 52-bit BigInt mask, intersect with bitwise AND, and extract the single set bit priority via bigintLog2 in O(L) total item length.',
    complexity: 'O(N * L) time, O(1) space per rucksack',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '157',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: RucksackCompartmentVisualizer,
};
