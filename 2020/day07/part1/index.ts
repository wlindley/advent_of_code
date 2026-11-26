import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { HandyHaversacksPart1Visualizer } from './viz/HandyHaversacksPart1Visualizer';

const EXAMPLE_INPUT = [
  'light red bags contain 1 bright white bag, 2 muted yellow bags.',
  'dark orange bags contain 3 bright white bags, 4 muted yellow bags.',
  'bright white bags contain 1 shiny gold bag.',
  'muted yellow bags contain 2 shiny gold bags, 9 faded blue bags.',
  'shiny gold bags contain 1 dark olive bag, 2 vibrant plum bags.',
  'dark olive bags contain 3 faded blue bags, 4 dotted black bags.',
  'vibrant plum bags contain 5 faded blue bags, 6 dotted black bags.',
  'faded blue bags contain no other bags.',
  'dotted black bags contain no other bags.',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2020,
    day: 7,
    part: 1,
    title: 'Handy Haversacks',
    puzzleUrl: 'https://adventofcode.com/2020/day/7',
    summary: 'Count how many distinct outer bag colors can eventually hold a shiny gold bag.',
    algorithmSummary:
      'Parse bag containment rules into a validated BagRuleGraph, build reverse adjacency, and run reverse-BFS under ANCESTOR_COLORS_POLICY.',
    complexity: 'O(V + E) graph construction & reverse-BFS traversal',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '4',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: HandyHaversacksPart1Visualizer,
};
