import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { CruciblePart1Visualizer } from './viz/CruciblePart1Visualizer';

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
    part: 1,
    title: 'Clumsy Crucible',
    puzzleUrl: 'https://adventofcode.com/2023/day/17',
    summary:
      'Find the minimum heat loss path from top-left to bottom-right when the crucible moves 1 to 3 blocks straight before turning 90 degrees.',
    algorithmSummary:
      'Axis-alternating shortest-path graph (2*H*W states) solved with an intrusive O(1) Dial bucket queue over edge weights bounded by 9*maxRun.',
    complexity: 'O(H * W * maxRun + goalHeat) time, O(H * W) space',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '102',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: CruciblePart1Visualizer,
};
