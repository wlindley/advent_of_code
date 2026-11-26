import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { LavaPart2Visualizer } from './viz/LavaPart2Visualizer';

const EXAMPLE_INPUT = [
  '.|...\\....',
  '|.-.\\.....',
  '.....|-...',
  '........|.',
  '..........',
  '.........\\',
  '..../.\\\\..',
  '.-.-/..|..',
  '.|....-|.\\',
  '..//.|....',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2023,
    day: 16,
    part: 2,
    title: 'The Floor Will Be Lava',
    puzzleUrl: 'https://adventofcode.com/2023/day/16#part2',
    summary:
      'Test every inward-facing perimeter tile entry around the optical contraption and find the starting beam that energizes the most tiles.',
    algorithmSummary:
      'Reuses a single flat-queue BeamTracer across all 2*(H+W) perimeter entries, dynamically selecting the maximum-energized entry in PerimeterScanResult and sampling its wavefront.',
    complexity: 'O((H + W) * H * W) time, O(H * W) space',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '51',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: LavaPart2Visualizer,
};
