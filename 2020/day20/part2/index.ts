import type { PuzzleSolver } from '../../../shared/core';
import type { PuzzlePartManifest } from '../../../shared/viz';
import { solver } from './domain';
import { JurassicJigsawPart2Visualizer } from './viz/JurassicJigsawPart2Visualizer';

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
    part: 2,
    title: 'Jurassic Jigsaw',
    puzzleUrl: 'https://adventofcode.com/2020/day/20#part2',
    summary:
      'Stitch the borderless reassembled ocean image, orient it to locate all sea-monster patterns across D4 symmetries, and count the remaining rough water cells.',
    algorithmSummary:
      'Reassemble tiles via canonical-edge pruned DFS, strip 1-pixel borders into a dense SquareBitmap, and scan all 8 D4 orientations with a 15-offset mask to compute water roughness.',
    complexity: 'O(N^2 * 8) assembly + O(8 * (N*(S-2))^2) sea-monster scan',
  },
  exampleInput: EXAMPLE_INPUT,
  exampleAnswer: '273',
  solver: solver as PuzzleSolver<unknown, unknown>,
  Visualizer: JurassicJigsawPart2Visualizer,
};
