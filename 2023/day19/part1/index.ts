import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { AplentyPart1Visualizer } from './viz/AplentyPart1Visualizer';

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
    part: 1,
    title: 'Aplenty',
    puzzleUrl: 'https://adventofcode.com/2023/day/19',
    summary:
      'Route each machine part through conditional x/m/a/s rating workflows starting at "in" and sum the ratings of accepted parts.',
    algorithmSummary:
      'DAG-validated workflow graph evaluation with strict < / > rule short-circuiting and fallback routing.',
    complexity: 'O(P * D) time and O(W + P) space for P parts, workflow depth D, and W workflows',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '19114',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: AplentyPart1Visualizer,
};
