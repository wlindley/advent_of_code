import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { CruciblePart2Visualizer } from './viz/CruciblePart2Visualizer';

const EXAMPLE_INPUT = [
  '2413432311323',
  '3215453535623',
  '3255245654254',
  '3446585845452',
  '4546657867536',
  '1438598798454',
  '4457876987766',
  '3637877979653',
  '4654967986887',
  '4564679986453',
  '1224686865563',
  '2546548887735',
  '4322674655533',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2023,
    day: 17,
    part: 2,
    title: 'Clumsy Crucible',
    puzzleUrl: 'https://adventofcode.com/2023/day/17#part2',
    summary:
      'Find the minimum heat loss path from top-left to bottom-right when the ultra crucible moves 4 to 10 blocks straight before turning 90 degrees or stopping.',
    algorithmSummary:
      'Axis-alternating shortest-path graph (2*H*W states) with 4..10 straight-run transitions solved via an intrusive O(1) Dial bucket queue.',
    complexity: 'O(H * W * maxRun + goalHeat) time, O(H * W) space',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '94',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: CruciblePart2Visualizer,
};
