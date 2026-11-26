import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { AplentyPart2Visualizer } from './viz/AplentyPart2Visualizer';

const EXAMPLE_INPUT = [
  'px{a<2006:qkq,m>2090:A,rfg}',
  'pv{a>1716:R,A}',
  'lnx{m>1548:A,A}',
  'rfg{s<537:gd,x>2440:R,A}',
  'qs{s>3448:A,lnx}',
  'qkq{x<1416:A,crn}',
  'crn{x>2662:A,R}',
  'in{s<1351:px,qqz}',
  'qqz{s>2770:qs,m<1801:hdj,R}',
  'gd{a>3333:R,R}',
  'hdj{m>838:A,pv}',
  '',
  '{x=787,m=2655,a=1222,s=2876}',
  '{x=1679,m=44,a=2067,s=496}',
  '{x=2036,m=264,a=79,s=2244}',
  '{x=2461,m=1339,a=466,s=291}',
  '{x=2127,m=1623,a=2188,s=1013}',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2023,
    day: 19,
    part: 2,
    title: 'Aplenty',
    puzzleUrl: 'https://adventofcode.com/2023/day/19#part2',
    summary:
      'Partition the 4D [1..4000]^4 x/m/a/s rating hyperrectangle through the workflow DAG starting at "in" and count all accepted integer combinations.',
    algorithmSummary:
      'Iterative DFS over RatingBox hyperrectangles splitting ClosedIntervals along < / > rules into disjoint accepted boxes summed via BigInt volume.',
    complexity: 'O(B * R) time and O(D * R) stack space for B terminal boxes, D workflow depth, and R rules per workflow',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '167409079868000',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: AplentyPart2Visualizer,
};
