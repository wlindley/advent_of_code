import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Part2Visualizer } from './viz/Part2Visualizer';

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
    part: 2,
    title: 'Snailfish',
    puzzleUrl: 'https://adventofcode.com/2021/day/18#part2',
    summary:
      'Find the largest magnitude achievable by adding any two distinct snailfish numbers from the homework list in either order and reducing the sum.',
    algorithmSummary:
      'Evaluate all N*(N-1) ordered distinct pairs over flat (value, depth) leaf arrays using zero-allocation buffer reduction and an O(L) stack-folded magnitude evaluator.',
    complexity: 'O(N^2 * S * L) time and O(L) space for N homework lines, S reductions per pair, and L leaves',
  },
  exampleInput: EXAMPLE_HOMEWORK,
  exampleAnswer: '3993',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: Part2Visualizer,
};
