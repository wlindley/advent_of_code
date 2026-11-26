import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { AlmanacJourneyVisualizer } from './viz/AlmanacJourneyVisualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2023,
    day: 5,
    part: 1,
    title: 'If You Give A Seed A Fertilizer',
    puzzleUrl: 'https://adventofcode.com/2023/day/5',
    summary:
      'Route each initial seed through a chain of piecewise-linear category maps (using identity when unmatched) and report the lowest resulting location.',
    algorithmSummary:
      'Parse seeds and sorted non-overlapping RangeRule triples into BigInt RangeMaps, binary-search each stage in O(log R) per map, and take the minimum final location.',
    complexity: 'O(R log R + S · M · log R) time, O(S + R) space',
  },
  exampleInput: [
    'seeds: 79 14 55 13',
    '',
    'seed-to-soil map:',
    '50 98 2',
    '52 50 48',
    '',
    'soil-to-fertilizer map:',
    '0 15 37',
    '37 52 2',
    '39 0 15',
    '',
    'fertilizer-to-water map:',
    '49 53 8',
    '0 11 42',
    '42 0 7',
    '57 7 4',
    '',
    'water-to-light map:',
    '88 18 7',
    '18 25 70',
    '',
    'light-to-temperature map:',
    '45 77 23',
    '81 45 19',
    '68 64 13',
    '',
    'temperature-to-humidity map:',
    '0 69 1',
    '1 0 69',
    '',
    'humidity-to-location map:',
    '60 56 37',
    '56 93 4',
  ].join('\n'),
  exampleAnswer: '35',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: AlmanacJourneyVisualizer,
};
