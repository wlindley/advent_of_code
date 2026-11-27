import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Visualizer } from './viz/Visualizer';

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2019,
    day: 17,
    part: 2,
    title: 'Set and Forget',
    puzzleUrl: 'https://adventofcode.com/2019/day/17#part2',
    summary:
      'Trace the scaffold network into turn-and-run movement commands, compress them into Main plus A/B/C subroutines within 20 ASCII characters each, and wake the robot to report total dust collected.',
    algorithmSummary:
      'Capture the scaffold grid via an initial VM run, greedily follow straight segments to emit L/R/step tokens, recursively factor into three <=20-char subroutines, and feed the ASCII program to a patched memory[0]=2 Intcode VM.',
    complexity: 'O(I + W * H + B) time and O(W * H + L) memory for I VM steps, W x H grid, and B compression branches over path length L',
  },
  exampleInput:
    '1,47,48,49,1006,49,21,4,53,1001,8,1,8,1008,8,293,50,1006,50,7,99,3,51,1008,51,10,50,1,52,50,52,1008,52,5,50,1006,50,21,104,79,104,75,104,10,104,1024,99,0,1,0,0,0,0,35,35,35,35,35,35,35,46,46,46,35,35,35,35,35,10,35,46,46,46,46,46,35,46,46,46,35,46,46,46,35,10,35,46,46,46,46,46,35,46,46,46,35,46,46,46,35,10,46,46,46,46,46,46,35,46,46,46,35,46,46,46,35,10,46,46,46,46,46,46,35,46,46,46,35,35,35,46,35,10,46,46,46,46,46,46,35,46,46,46,46,46,35,46,35,10,94,35,35,35,35,35,35,35,35,46,46,46,35,46,35,10,46,46,46,46,46,46,35,46,35,46,46,46,35,46,35,10,46,46,46,46,46,46,35,35,35,35,35,35,35,35,35,10,46,46,46,46,46,46,46,46,35,46,46,46,35,46,46,10,46,46,46,46,35,35,35,35,35,35,35,35,35,46,46,10,46,46,46,46,35,46,46,46,35,46,46,46,46,46,46,10,46,46,46,46,35,46,46,46,35,46,46,46,46,46,46,10,46,46,46,46,35,46,46,46,35,46,46,46,46,46,46,10,46,46,46,46,35,35,35,35,35,46,46,46,46,46,46,10',
  exampleAnswer: '1024',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer,
};
