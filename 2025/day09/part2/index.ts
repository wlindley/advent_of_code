import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { TheaterPolygonVisualizer } from './viz/TheaterPolygonVisualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2025,
    day: 9,
    part: 2,
    title: 'Movie Theater — Part Two',
    puzzleUrl: 'https://adventofcode.com/2025/day/9#part2',
    summary: 'Find the largest inclusive axis-aligned rectangle between two red tiles that stays wholly inside the green tile loop.',
    algorithmSummary:
      'Build a gap-preserving 2D compressed orthogonal grid via half-open parity scanlines and 2D prefix sums, then prune candidate corner pairs by area before O(1) containment queries.',
    complexity: 'O(N² + M²) time, O(M²) space (M ≤ 2N compressed slabs)',
  },
  exampleInput: ['7,1', '11,1', '11,7', '9,7', '9,5', '2,5', '2,3', '7,3'].join('\n'),
  exampleAnswer: '24',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: TheaterPolygonVisualizer,
};
