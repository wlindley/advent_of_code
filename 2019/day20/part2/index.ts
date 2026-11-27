import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { Visualizer } from './viz/Visualizer';

const EXAMPLE_3 = [
  '             Z L X W       C                 ',
  '             Z P Q B       K                 ',
  '  ###########.#.#.#.#######.###############  ',
  '  #...#.......#.#.......#.#.......#.#.#...#  ',
  '  ###.#.#.#.#.#.#.#.###.#.#.#######.#.#.###  ',
  '  #.#...#.#.#...#.#.#...#...#...#.#.......#  ',
  '  #.###.#######.###.###.#.###.###.#.#######  ',
  '  #...#.......#.#...#...#.............#...#  ',
  '  #.#########.#######.#.#######.#######.###  ',
  '  #...#.#    F       R I       Z    #.#.#.#  ',
  '  #.###.#    D       E C       H    #.#.#.#  ',
  '  #.#...#                           #...#.#  ',
  '  #.###.#                           #.###.#  ',
  '  #.#....OA                       WB..#.#..ZH',
  '  #.###.#                           #.#.#.#  ',
  'CJ......#                           #.....#  ',
  '  #######                           #######  ',
  '  #.#....CK                         #......IC',
  '  #.###.#                           #.###.#  ',
  '  #.....#                           #...#.#  ',
  '  ###.###                           #.#.#.#  ',
  'XF....#.#                         RF..#.#.#  ',
  '  #####.#                           #######  ',
  '  #......CJ                       NM..#...#  ',
  '  ###.#.#                           #.###.#  ',
  'RE....#.#                           #......RF',
  '  ###.###        X   X       L      #.#.#.#  ',
  '  #.....#        F   Q       P      #.#.#.#  ',
  '  ###.###########.###.#######.#########.###  ',
  '  #.....#...#.....#.......#...#.....#.#...#  ',
  '  #####.#.###.#######.#######.###.###.#.#.#  ',
  '  #.......#.......#.#.#.#.#...#...#...#.#.#  ',
  '  #####.###.#####.#.#.#.#.###.###.#.###.###  ',
  '  #.......#.....#.#...#...............#...#  ',
  '  #############.#.#.###.###################  ',
  '               A O F   N                     ',
  '               A A D   M                     ',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2019,
    day: 20,
    part: 2,
    title: 'Donut Maze',
    puzzleUrl: 'https://adventofcode.com/2019/day/20#part2',
    summary:
      'Navigate a recursively nested Donut Maze from outer AA at depth 0 to outer ZZ at depth 0, where inner portals descend and outer portals ascend.',
    algorithmSummary:
      'Reuse precomputed portal-to-portal corridor distances and run depth-aware Dijkstra over (portal, depth) states bounded by portal count.',
    complexity: 'O(P * V + P^3 log P) worst-case time across bounded recursion depths',
  },
  exampleInput: EXAMPLE_3,
  exampleAnswer: '396',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer,
};
