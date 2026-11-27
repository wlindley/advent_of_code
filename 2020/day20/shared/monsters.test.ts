import { describe, expect, it } from 'vitest';
import { assembleGrid } from './assembler';
import { type D4Orientation, SquareBitmap, transformSquare } from './d4';
import {
  SEA_MONSTER_HEIGHT,
  SEA_MONSTER_OFFSETS,
  SEA_MONSTER_WIDTH,
  scanSeaMonsters,
} from './monsters';
import { parseTiles } from './parser';

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

function stampMonster(side: number, r0: number, c0: number, extraHashes: number): SquareBitmap {
  const pixels = new Uint8Array(side * side);
  for (const [dr, dc] of SEA_MONSTER_OFFSETS) {
    pixels[(r0 + dr) * side + (c0 + dc)] = 1;
  }
  for (let i = 0; i < extraHashes; i += 1) {
    pixels[side * side - 1 - i] = 1;
  }
  return new SquareBitmap(side, pixels);
}

describe('2020 Day 20 shared/monsters', () => {
  it('finds 2 sea monsters and water roughness 273 on the official 9-tile example', () => {
    expect(SEA_MONSTER_HEIGHT).toBe(3);
    expect(SEA_MONSTER_WIDTH).toBe(20);
    expect(SEA_MONSTER_OFFSETS.length).toBe(15);

    const stitched = assembleGrid(parseTiles(OFFICIAL_9_TILE_EXAMPLE)).stitchBorderless();
    const scan = scanSeaMonsters(stitched);
    expect(scan.monsterCount).toBe(2);
    expect(scan.monsterCellCount).toBe(30);
    expect(scan.hashCount).toBe(303);
    expect(scan.waterRoughness).toBe(273);

    let countedMonsterCells = 0;
    for (let r = 0; r < scan.image.side; r += 1) {
      for (let c = 0; c < scan.image.side; c += 1) {
        if (scan.isMonsterCell(r, c)) countedMonsterCells += 1;
      }
    }
    expect(countedMonsterCells).toBe(30);
  });

  it('detects monsters across arbitrary D4 orientations', () => {
    const base = stampMonster(22, 2, 1, 3);
    for (const ori of [0, 1, 5] as readonly D4Orientation[]) {
      const rotated = transformSquare(base, ori);
      const scan = scanSeaMonsters(rotated);
      expect(scan.monsterCount).toBe(1);
      expect(scan.monsterCellCount).toBe(15);
      expect(scan.waterRoughness).toBe(3);
    }
  });

  it('returns ori 0 and 0 monsters for small (< 20) or monster-free images', () => {
    const small = new SquareBitmap(8, new Uint8Array(64).fill(1));
    const smallScan = scanSeaMonsters(small);
    expect(smallScan.orientation).toBe(0);
    expect(smallScan.monsterCount).toBe(0);
    expect(smallScan.waterRoughness).toBe(64);

    const emptyLarge = new SquareBitmap(20, new Uint8Array(400));
    const emptyScan = scanSeaMonsters(emptyLarge);
    expect(emptyScan.orientation).toBe(0);
    expect(emptyScan.monsterCount).toBe(0);
    expect(emptyScan.waterRoughness).toBe(0);
  });
});
