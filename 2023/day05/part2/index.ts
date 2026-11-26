import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { AlmanacRangeVisualizer } from './viz/AlmanacRangeVisualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2023,
    day: 5,
    part: 2,
    title: 'If You Give A Seed A Fertilizer',
    puzzleUrl: 'https://adventofcode.com/2023/day/5#part2',
    summary:
      'Interpret the seeds header as (start, length) closed intervals, sweep them through chained piecewise-linear category maps, and report the lowest reachable location.',
    algorithmSummary:
      'Normalize seed pairs into a sorted disjoint IntervalUnion, two-pointer sweep each stage against sorted RangeRules to split/shift FlowRibbons, coalesce destination bands, and read the leftmost endpoint.',
    complexity: 'O(N log N + R log R + M · (I + R)) time, O(I + R) space',
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
  exampleAnswer: '46',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: AlmanacRangeVisualizer,
};
