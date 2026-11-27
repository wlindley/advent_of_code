import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Part1Visualizer } from './viz/Part1Visualizer';

const EXAMPLE_INPUT = [
  '6,10',
  '0,14',
  '9,10',
  '0,3',
  '10,4',
  '4,11',
  '6,0',
  '6,12',
  '4,1',
  '0,13',
  '10,12',
  '3,4',
  '3,0',
  '8,4',
  '1,10',
  '2,14',
  '8,10',
  '9,0',
  '',
  'fold along y=7',
  'fold along x=5',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2021,
    day: 13,
    part: 1,
    title: 'Transparent Origami',
    puzzleUrl: 'https://adventofcode.com/2021/day/13',
    summary:
      'Reflect a set of marked integer coordinates across the first horizontal or vertical fold crease on transparent paper and count the distinct visible dots.',
    algorithmSummary:
      'Sort and deduplicate dot coordinates into an immutable DotSheet, reflect dots beyond the first fold crease via polymorphic axis adapters, and deduplicate overlaps.',
    complexity: 'O(N log N) time, O(N) space for N initial dots',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '17',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: Part1Visualizer,
};
