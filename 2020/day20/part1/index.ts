import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { JurassicJigsawPart1Visualizer } from './viz/JurassicJigsawPart1Visualizer';

const EXAMPLE_INPUT = [
  'Tile 2311:',
  '..##.#..#.', '##..#.....', '#...##..#.', '####.#...#', '##.##.###.',
  '##...#.###', '.#.#.#..##', '..#....#..', '###...#.#.', '..###..###',
  '',
  'Tile 1951:',
  '#.##...##.', '#.####...#', '.....#..##', '#...######', '.##.#....#',
  '.###.#####', '###.##.##.', '.###....#.', '..#.#..#.#', '#...##.#..',
  '',
  'Tile 1171:',
  '####...##.', '#..##.#..#', '##.#..#.#.', '.###.####.', '..###.####',
  '.##....##.', '.#...####.', '#.##.####.', '####..#...', '.....##...',
  '',
  'Tile 1427:',
  '###.##.#..', '.#..#.##..', '.#.##.#..#', '#.#.#.##.#', '....#...##',
  '...##..##.', '...#.#####', '.#.####.#.', '..#..###.#', '..##.#..#.',
  '',
  'Tile 1489:',
  '##.#.#....', '..##...#..', '.##..##...', '..#...#...', '#####...#.',
  '#..#.#.#.#', '...#.#.#..', '##.#...##.', '..##.##.##', '###.##.#..',
  '',
  'Tile 2473:',
  '#....####.', '#..#.##...', '#.##..#...', '######.#.#', '.#...#.#.#',
  '.#########', '.###.#..#.', '########.#', '##...##.#.', '..###.#.#.',
  '',
  'Tile 2971:',
  '..#.#....#', '#...###...', '#.#.###...', '##.##..#..', '.#####..##',
  '.#..####.#', '#..#.#..#.', '..####.###', '..#.#.###.', '...#.#.#.#',
  '',
  'Tile 2729:',
  '...#.#.#.#', '####.#....', '..#.#.....', '....#..#.#', '.##..##.#.',
  '.#.####...', '####.#.#..', '##.####...', '##..#.##..', '#.##...##.',
  '',
  'Tile 3079:',
  '#.#.#####.', '.#..######', '..#.......', '######....', '####.#..#.',
  '.#...#.##.', '#.#####.##', '..#.###...', '..#.......', '..#.###...',
].join('\n');

export const manifest: PuzzlePartManifest = {
  meta: {
    year: 2020,
    day: 20,
    part: 1,
    title: 'Jurassic Jigsaw',
    puzzleUrl: 'https://adventofcode.com/2020/day/20',
    summary:
      'Reassemble rotated and flipped square satellite image tiles by matching adjacent borders, then multiply the four corner tile IDs.',
    algorithmSummary:
      'Precompute all 8 D4 border bitmasks per tile, index edge buckets with Map and per-tile canonical edge deduplication, and run outer-border-pruned DFS assembly.',
    complexity: 'O(N^2 * 8) precomputation plus pruned DFS over N^2 tiles',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '20899048083289',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: JurassicJigsawPart1Visualizer,
};
