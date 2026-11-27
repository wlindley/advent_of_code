import { describe, expect, it } from 'vitest';
import { parseTiles } from './parser';
import { CORNER_PRODUCT_POLICY, WATER_ROUGHNESS_POLICY } from './policies';
import { JigsawSolver } from './solver';
import { DEFAULT_MAX_TRACE_STEPS, traceJigsaw } from './trace';

const OFFICIAL_9_TILE_EXAMPLE = [
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

describe('2020 Day 20 shared/trace & solver', () => {
  it('traces corners mode with default and capped maxSteps', () => {
    const puzzle = parseTiles(OFFICIAL_9_TILE_EXAMPLE);
    const full = traceJigsaw(puzzle, 'corners', undefined);
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(160);
    expect(full.length).toBe(10); // 9 assemble + 1 corners
    expect(full[0]!.phase).toBe('assemble');
    expect(full[0]!.placedCount).toBe(1);
    expect(full[0]!.pixelSide).toBe(30);
    expect(full[0]!.cellCodeAt(0, 0)).toBeGreaterThanOrEqual(1);
    expect(full[0]!.cellCodeAt(29, 29)).toBe(0);

    const last = full[full.length - 1]!;
    expect(last.phase).toBe('corners');
    expect(last.borderless).toBe(false);
    expect(last.cornerProduct).toBe(20899048083289n);
    // Corner tile '#' renders as 3, '.' as 1, non-corner '#' as 2
    let sawGoldCorner = false;
    let sawNonCornerOn = false;
    for (let r = 0; r < last.pixelSide; r += 1) {
      for (let c = 0; c < last.pixelSide; c += 1) {
        const code = last.cellCodeAt(r, c);
        if (code === 3) sawGoldCorner = true;
        if (code === 2) sawNonCornerOn = true;
      }
    }
    expect(sawGoldCorner).toBe(true);
    expect(sawNonCornerOn).toBe(true);

    const capped5 = traceJigsaw(puzzle, 'corners', { maxSteps: 5 });
    expect(capped5.length).toBe(5);
    expect(capped5[4]!.phase).toBe('corners');

    const capped1 = traceJigsaw(puzzle, 'corners', { maxSteps: 1 });
    expect(capped1.length).toBe(1);
    expect(capped1[0]!.phase).toBe('corners');
  });

  it('traces monsters mode through assemble, stitch, and monster scan phases', () => {
    const puzzle = parseTiles(OFFICIAL_9_TILE_EXAMPLE);
    const frames = traceJigsaw(puzzle, 'monsters', { maxSteps: 6 });
    expect(frames.length).toBe(6);
    expect(frames[4]!.phase).toBe('stitch');
    expect(frames[4]!.borderless).toBe(true);
    expect(frames[4]!.pixelSide).toBe(24);
    expect(frames[4]!.cellCodeAt(0, 0)).toBeGreaterThanOrEqual(1);

    const last = frames[5]!;
    expect(last.phase).toBe('monsters');
    expect(last.monsterCount).toBe(2);
    expect(last.waterRoughness).toBe(273);
    let monsterPixels = 0;
    for (let r = 0; r < last.pixelSide; r += 1) {
      for (let c = 0; c < last.pixelSide; c += 1) {
        if (last.cellCodeAt(r, c) === 4) monsterPixels += 1;
      }
    }
    expect(monsterPixels).toBe(30);

    const capped2 = traceJigsaw(puzzle, 'monsters', { maxSteps: 2 });
    expect(capped2.map((f) => f.phase)).toEqual(['stitch', 'monsters']);

    const capped1 = traceJigsaw(puzzle, 'monsters', { maxSteps: 1 });
    expect(capped1.map((f) => f.phase)).toEqual(['monsters']);
  });

  it('rejects invalid maxSteps and delegates via JigsawSolver for both policies', () => {
    const solver1 = new JigsawSolver(CORNER_PRODUCT_POLICY);
    const solver2 = new JigsawSolver(WATER_ROUGHNESS_POLICY);
    const parsed = solver1.parse(OFFICIAL_9_TILE_EXAMPLE);

    expect(solver1.solve(parsed)).toBe(20899048083289n);
    expect(solver2.solve(parsed)).toBe(273n);
    expect(solver1.trace(parsed, undefined).length).toBe(10);
    expect(solver2.trace(parsed, { maxSteps: 4 }).length).toBe(4);
    expect(() => traceJigsaw(parsed, 'corners', { maxSteps: 0 })).toThrow(RangeError);
  });
});
