import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { AllergenPart1Visualizer } from './viz/AllergenPart1Visualizer';

const EXAMPLE_INPUT = [
  'mxmxvkd kfcds sqjhc nhms (contains dairy, fish)',
  'trh fvjkl sbzzf mxmxvkd (contains dairy)',
  'sqjhc fvjkl (contains soy)',
  'sqjhc mxmxvkd sbzzf (contains fish)',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2020,
    day: 21,
    part: 1,
    title: 'Allergen Assessment',
    puzzleUrl: 'https://adventofcode.com/2020/day/21',
    summary:
      'Intersect ingredient sets per listed allergen across all foods to isolate allergen-free ingredients and count their total appearances.',
    algorithmSummary:
      'Encode ingredients as BigInt bitmasks, bitwise-AND food masks per allergen, OR suspect masks, and sum document frequencies of complement safe bits.',
    complexity: 'O(F * I) parsing + O(F * A) BigInt mask intersection',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '5',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: AllergenPart1Visualizer,
};
