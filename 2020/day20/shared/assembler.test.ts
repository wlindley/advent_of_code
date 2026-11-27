import { describe, expect, it } from 'vitest';
import { assembleGrid } from './assembler';
import { D4_COUNT, type D4Orientation, SquareBitmap, transformSquare } from './d4';
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

function nextRng(seed: number): number {
  return (Math.imul(seed, 1664525) + 1013904223) >>> 0;
}

function buildSeededPuzzle(
  gridSide: number,
  tileSize: number,
  seedInit: number,
): { raw: string; expectedCornerProduct: bigint; expectedInner: Uint8Array } {
  let seed = seedInit;
  const inner = tileSize - 2;
  const fullInnerSide = gridSide * inner;
  const expectedInner = new Uint8Array(fullInnerSide * fullInnerSide);
  const tilesGrid: Uint8Array[][] = Array.from({ length: gridSide }, () =>
    Array.from({ length: gridSide }, () => new Uint8Array(tileSize * tileSize)),
  );
  for (let tr = 0; tr < gridSide; tr += 1) {
    for (let tc = 0; tc < gridSide; tc += 1) {
      const buf = tilesGrid[tr]![tc]!;
      for (let r = 0; r < tileSize; r += 1) {
        for (let c = 0; c < tileSize; c += 1) {
          seed = nextRng(seed);
          let bit = (seed >>> 28) & 1;
          if (tr > 0 && r === 0) bit = tilesGrid[tr - 1]![tc]![(tileSize - 1) * tileSize + c]!;
          if (tc > 0 && c === 0) bit = tilesGrid[tr]![tc - 1]![r * tileSize + (tileSize - 1)]!;
          buf[r * tileSize + c] = bit;
          if (r > 0 && r < tileSize - 1 && c > 0 && c < tileSize - 1) {
            expectedInner[(tr * inner + (r - 1)) * fullInnerSide + (tc * inner + (c - 1))] = bit;
          }
        }
      }
    }
  }
  const blocks: string[] = [];
  const ids: number[][] = [];
  for (let tr = 0; tr < gridSide; tr += 1) {
    const rowIds: number[] = [];
    for (let tc = 0; tc < gridSide; tc += 1) {
      const id = 100 + tr * gridSide + tc;
      rowIds.push(id);
      const buf = tilesGrid[tr]![tc]!;
      seed = nextRng(seed);
      const ori = (seed % D4_COUNT) as D4Orientation;
      const lines = [`Tile ${id}:`];
      for (let r = 0; r < tileSize; r += 1) {
        let line = '';
        for (let c = 0; c < tileSize; c += 1) {
          const sr = ori & 1 ? c : r;
          const sc = ori & 1 ? r : c;
          const rr = ori & 2 ? tileSize - 1 - sr : sr;
          const cc = ori & 4 ? tileSize - 1 - sc : sc;
          line += buf[rr * tileSize + cc] === 1 ? '#' : '.';
        }
        lines.push(line);
      }
      blocks.push(lines.join('\n'));
    }
    ids.push(rowIds);
  }
  const cornerProd =
    BigInt(ids[0]![0]!) *
    BigInt(ids[0]![gridSide - 1]!) *
    BigInt(ids[gridSide - 1]![0]!) *
    BigInt(ids[gridSide - 1]![gridSide - 1]!);
  return { raw: blocks.reverse().join('\n\n'), expectedCornerProduct: cornerProd, expectedInner };
}

function matchesAnyD4(actual: SquareBitmap, expected: SquareBitmap): boolean {
  for (let o = 0; o < D4_COUNT; o += 1) {
    const candidate = transformSquare(expected, o as D4Orientation);
    let same = true;
    for (let i = 0; i < actual.side * actual.side; i += 1) {
      if (actual.atIndex(i) !== candidate.atIndex(i)) {
        same = false;
        break;
      }
    }
    if (same) return true;
  }
  return false;
}

describe('2020 Day 20 shared/assembler', () => {
  it('assembles the official 9-tile example and stitches borderless image', () => {
    const grid = assembleGrid(parseTiles(OFFICIAL_9_TILE_EXAMPLE));
    expect(grid.cornerProduct).toBe(20899048083289n);
    expect(grid.isCorner(0, 0)).toBe(true);
    expect(grid.isCorner(0, 1)).toBe(false);
    expect(grid.isCorner(2, 2)).toBe(true);
    const stitched = grid.stitchBorderless();
    expect(stitched.side).toBe(24);
  });

  it('handles 1x1 grids and BigInt corner products exceeding MAX_SAFE_INTEGER', () => {
    const one = assembleGrid(parseTiles('Tile 9999:\n#.#\n.#.\n###'));
    expect(one.cornerIds).toEqual([9999, 9999, 9999, 9999]);
    expect(one.cornerProduct).toBe(9999n ** 4n);
    expect(one.cornerProduct > BigInt(Number.MAX_SAFE_INTEGER)).toBe(true);
  });

  it('exercises backtracking on cand.top !== reqTop, self-duplicate borders, and unsolvable grids', () => {
    const backtrackRaw = [
      'Tile 1:\n#...\n...#\n....\n.#..',
      'Tile 2:\n....\n#...\n...#\n.###',
      'Tile 3:\n.#..\n#..#\n...#\n#.##',
      'Tile 4:\n.###\n#..#\n#..#\n####',
    ].join('\n\n');
    const solved = assembleGrid(parseTiles(backtrackRaw));
    expect(solved.cornerProduct).toBe(24n);

    const unsolvable = [
      'Tile 1:\n###\n...\n...',
      'Tile 2:\n...\n...\n...',
      'Tile 3:\n###\n###\n###',
      'Tile 4:\n.#.\n.#.\n.#.',
    ].join('\n\n');
    expect(() => assembleGrid(parseTiles(unsolvable))).toThrow();
  });

  it('matches independent seeded 3x3 and 4x4 slicer oracles', () => {
    for (const [side, seed] of [[3, 20202001], [4, 20202002]] as const) {
      const { raw, expectedCornerProduct, expectedInner } = buildSeededPuzzle(side, 6, seed);
      const assembled = assembleGrid(parseTiles(raw));
      expect(assembled.cornerProduct).toBe(expectedCornerProduct);
      const stitched = assembled.stitchBorderless();
      expect(stitched.side).toBe(side * 4);
      expect(matchesAnyD4(stitched, new SquareBitmap(side * 4, expectedInner))).toBe(true);
    }
  });
});
