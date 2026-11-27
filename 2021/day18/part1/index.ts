import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Part1Visualizer } from './viz/Part1Visualizer';

const EXAMPLE_HOMEWORK = [
  '[[[0,[5,8]],[[1,7],[9,6]]],[[4,[1,2]],[[1,4],2]]]',
  '[[[5,[2,8]],4],[5,[[9,9],0]]]',
  '[6,[[[6,2],[5,6]],[[7,6],[4,7]]]]',
  '[[[6,[0,7]],[0,9]],[4,[9,[9,0]]]]',
  '[[[7,[6,4]],[3,[1,3]]],[[[5,5],1],9]]',
  '[[6,[[7,3],[3,2]]],[[[3,8],[5,7]],4]]',
  '[[[[5,4],[7,7]],8],[[8,3],8]]',
  '[[9,3],[[9,9],[6,[4,9]]]]',
  '[[2,[[7,7],7]],[[5,8],[[9,3],[0,2]]]]',
  '[[[[5,2],5],[8,[3,7]]],[[5,[7,5]],[4,4]]]',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2021,
    day: 18,
    part: 1,
    title: 'Snailfish',
    puzzleUrl: 'https://adventofcode.com/2021/day/18',
    summary:
      'Add a list of nested snailfish number pairs left-to-right, reducing after every addition until stable, and compute the magnitude of the final sum.',
    algorithmSummary:
      'Represent each pair tree as a flat array of (value, depth) leaves, perform O(1) neighbor explode carries and floor/ceil splits on local buffers, and fold magnitude via an O(L) depth stack.',
    complexity: 'O(N * S * L) time and O(L) space for N homework lines, S reductions per addition, and L leaves',
  },
  exampleInput: EXAMPLE_HOMEWORK,
  exampleAnswer: '4140',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: Part1Visualizer,
};
