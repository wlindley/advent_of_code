import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { ConstellationBridgeVisualizer } from './viz/ConstellationBridgeVisualizer';

const EXAMPLE_INPUT = [
  '162,817,812', '57,618,57', '906,360,560', '592,479,940', '352,342,300',
  '466,668,158', '542,29,236', '431,825,988', '739,650,466', '52,470,668',
  '216,146,977', '819,987,18', '117,168,530', '805,96,715', '346,949,466',
  '970,615,88', '941,993,340', '862,61,35', '984,92,344', '425,690,689',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2025,
    day: 8,
    part: 2,
    title: 'Playground',
    puzzleUrl: 'https://adventofcode.com/2025/day/8#part2',
    summary: 'Continue connecting the closest 3D junction boxes until all boxes form a single circuit, then multiply the X coordinates of the final bridge.',
    algorithmSummary:
      "Compute the unique Euclidean Minimum Spanning Tree via O(N^2) Prim's with O(N) typed arrays and lexicographic (distSq, u, v) tie-breaking, then take the longest MST edge.",
    complexity: 'O(N^2) time, O(N) space',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '25272',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: ConstellationBridgeVisualizer,
};
