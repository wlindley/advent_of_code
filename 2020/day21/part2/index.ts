import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { AllergenPart2Visualizer } from './viz/AllergenPart2Visualizer';

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
    part: 2,
    title: 'Allergen Assessment',
    puzzleUrl: 'https://adventofcode.com/2020/day/21#part2',
    summary:
      'Resolve the unique allergen-to-ingredient bijection via singleton peeling and list the dangerous ingredients sorted alphabetically by allergen.',
    algorithmSummary:
      'Intersect BigInt ingredient masks per allergen, iteratively lock degree-1 singleton candidates across rounds, mask locked bits out of remaining allergens, and join ingredients by ASCII allergen order.',
    complexity: 'O(F * I) parsing + O(F * A + A^2) BigInt peeling',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: 'mxmxvkd,sqjhc,fvjkl',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: AllergenPart2Visualizer,
};
