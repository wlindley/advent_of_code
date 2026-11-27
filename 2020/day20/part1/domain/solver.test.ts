import { describe, expect, it } from 'vitest';
import { solver } from './index';

const EXAMPLE_9_TILES = [
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

describe('2020 Day 20 Part 1 solver', () => {
  it('solves the official 9-tile example and exposes corners policy', () => {
    expect(solver.policy.id).toBe('corners');
    const parsed = solver.parse(EXAMPLE_9_TILES);
    expect(solver.solve(parsed)).toBe(20899048083289n);
  });

  it('produces trace frames with omitted and explicit maxSteps', () => {
    const parsed = solver.parse(EXAMPLE_9_TILES);
    const fullTrace = solver.trace(parsed);
    expect(fullTrace.length).toBe(10);
    expect(fullTrace[fullTrace.length - 1]!.phase).toBe('corners');
    expect(fullTrace[fullTrace.length - 1]!.cornerProduct).toBe(20899048083289n);

    const capped = solver.trace(parsed, { maxSteps: 4 });
    expect(capped.length).toBe(4);
    expect(capped[3]!.phase).toBe('corners');
  });

  it('throws on invalid input and invalid trace options', () => {
    expect(() => solver.parse('')).toThrow();
    const parsed = solver.parse(EXAMPLE_9_TILES);
    expect(() => solver.trace(parsed, { maxSteps: 0 })).toThrow(RangeError);
  });
});
