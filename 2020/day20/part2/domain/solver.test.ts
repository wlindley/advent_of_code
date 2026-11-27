import { describe, expect, it } from 'vitest';
import { solver } from './index';

const EXAMPLE_9_TILES = [
  'Tile 2311:\n..##.#..#.\n##..#.....\n#...##..#.\n####.#...#\n##.##.###.\n##...#.###\n.#.#.#..##\n..#....#..\n###...#.#.\n..###..###',
  'Tile 1951:\n#.##...##.\n#.####...#\n.....#..##\n#...######\n.##.#....#\n.###.#####\n###.##.##.\n.###....#.\n..#.#..#.#\n#...##.#..',
  'Tile 1171:\n####...##.\n#..##.#..#\n##.#..#.#.\n.###.####.\n..###.####\n.##....##.\n.#...####.\n#.##.####.\n####..#...\n.....##...',
  'Tile 1427:\n###.##.#..\n.#..#.##..\n.#.##.#..#\n#.#.#.##.#\n....#...##\n...##..##.\n...#.#####\n.#.####.#.\n..#..###.#\n..##.#..#.',
  'Tile 1489:\n##.#.#....\n..##...#..\n.##..##...\n..#...#...\n#####...#.\n#..#.#.#.#\n...#.#.#..\n##.#...##.\n..##.##.##\n###.##.#..',
  'Tile 2473:\n#....####.\n#..#.##...\n#.##..#...\n######.#.#\n.#...#.#.#\n.#########\n.###.#..#.\n########.#\n##...##.#.\n..###.#.#.',
  'Tile 2971:\n..#.#....#\n#...###...\n#.#.###...\n##.##..#..\n.#####..##\n.#..####.#\n#..#.#..#.\n..####.###\n..#.#.###.\n...#.#.#.#',
  'Tile 2729:\n...#.#.#.#\n####.#....\n..#.#.....\n....#..#.#\n.##..##.#.\n.#.####...\n####.#.#..\n##.####...\n##..#.##..\n#.##...##.',
  'Tile 3079:\n#.#.#####.\n.#..######\n..#.......\n######....\n####.#..#.\n.#...#.##.\n#.#####.##\n..#.###...\n..#.......\n..#.###...',
].join('\n\n');

const MONSTER: readonly (readonly [number, number])[] = [
  [0, 18], [1, 0], [1, 5], [1, 6], [1, 11], [1, 12], [1, 17], [1, 18], [1, 19],
  [2, 1], [2, 4], [2, 7], [2, 10], [2, 13], [2, 16],
];
const D4: readonly (readonly [number, number, number, number, number, number])[] = [
  [1, 0, 0, 0, 1, 0], [0, -1, 1, 1, 0, 0], [-1, 0, 1, 0, -1, 1], [0, 1, 0, -1, 0, 1],
  [1, 0, 0, 0, -1, 1], [0, -1, 1, -1, 0, 1], [-1, 0, 1, 0, 1, 0], [0, 1, 0, 1, 0, 0],
];

function reverseBits8(mask: number): number {
  let out = 0;
  for (let i = 0; i < 8; i += 1) out = (out << 1) | ((mask >> i) & 1);
  return out;
}

function pickSeams(count: number): number[] {
  const out: number[] = [];
  for (let m = 0; m < 256 && out.length < count; m += 1) if (m < reverseBits8(m)) out.push(m);
  return out;
}

function applyD4(grid: readonly string[], ori: number): string[] {
  const n = grid.length;
  const last = n - 1;
  const [dr, dc, ro, er, ec, co] = D4[ori]!;
  const out: string[] = [];
  for (let r = 0; r < n; r += 1) {
    let row = '';
    for (let c = 0; c < n; c += 1) row += grid[dr * r + dc * c + ro * last]![er * r + ec * c + co * last]!;
    out.push(row);
  }
  return out;
}

function buildOcean24(): string[] {
  const g: string[][] = [];
  for (let r = 0; r < 24; r += 1) g.push(Array<string>(24).fill('.'));
  for (const [mr, mc] of [[2, 1], [3, 2]] as const) for (const [dr, dc] of MONSTER) g[mr + dr]![mc + dc] = '#';
  for (let r = 8; r < 24; r += 2) for (let c = 0; c < 24; c += 1) if ((r + c) % 3 === 0) g[r]![c] = '#';
  const rows: string[] = [];
  for (const row of g) rows.push(row.join(''));
  return rows;
}

function scanOri(grid: readonly string[]): { monsterCount: number; monsterCellCount: number; hashes: number } {
  const n = grid.length;
  const mark = new Uint8Array(n * n);
  let monsterCount = 0;
  let hashes = 0;
  for (let r = 0; r < n; r += 1) for (let c = 0; c < n; c += 1) if (grid[r]![c] === '#') hashes += 1;
  for (let r = 0; r <= n - 3; r += 1) for (let c = 0; c <= n - 20; c += 1) {
    let ok = true;
    for (const [dr, dc] of MONSTER) if (grid[r + dr]![c + dc] !== '#') ok = false;
    if (!ok) continue;
    monsterCount += 1;
    for (const [dr, dc] of MONSTER) mark[(r + dr) * n + c + dc] = 1;
  }
  let monsterCellCount = 0;
  for (const v of mark) monsterCellCount += v;
  return { monsterCount, monsterCellCount, hashes };
}

function referenceScan(ocean: readonly string[]): { monsterCount: number; monsterCellCount: number; waterRoughness: number } {
  let best = scanOri(ocean);
  for (let ori = 1; ori < 8; ori += 1) {
    const cand = scanOri(applyD4(ocean, ori));
    if (cand.monsterCellCount > best.monsterCellCount) best = cand;
  }
  return { monsterCount: best.monsterCount, monsterCellCount: best.monsterCellCount, waterRoughness: best.hashes - best.monsterCellCount };
}

function seamBit(mask: number, i: number): string {
  return ((mask >> (7 - i)) & 1) === 1 ? '#' : '.';
}

function buildTile(ocean: readonly string[], seams: readonly number[], g: number, tr: number, tc: number): string[] {
  const vBase = g * (g + 1);
  let top = '.';
  let bot = '.';
  for (let i = 0; i < 8; i += 1) {
    top += seamBit(seams[tr * g + tc]!, i);
    bot += seamBit(seams[(tr + 1) * g + tc]!, i);
  }
  const rows: string[] = [`${top}.`];
  for (let ir = 0; ir < 8; ir += 1) {
    const vIdx = vBase + tr * (g + 1) + tc;
    rows.push(seamBit(seams[vIdx]!, ir) + ocean[tr * 8 + ir]!.slice(tc * 8, tc * 8 + 8) + seamBit(seams[vIdx + 1]!, ir));
  }
  rows.push(`${bot}.`);
  return rows;
}

function formatScrambledPuzzle(ocean: readonly string[], seams: readonly number[], g: number): string {
  const tiles: string[] = [];
  for (let tr = 0; tr < g; tr += 1) for (let tc = 0; tc < g; tc += 1) {
    tiles.push(applyD4(buildTile(ocean, seams, g, tr, tc), (tr * 5 + tc * 3 + 1) % 8).join('\n'));
  }
  const blocks: string[] = [];
  for (let i = 0; i < tiles.length; i += 1) blocks.push(`Tile ${100 + ((i * 5 + 1) % tiles.length) * 17}:\n${tiles[(i * 5 + 1) % tiles.length]!}`);
  return blocks.join('\n\n');
}

function stripedOcean(side: number, evenRow: string, oddRow: string): string[] {
  const rows: string[] = [];
  for (let r = 0; r < side; r += 1) rows.push(r % 2 === 0 ? evenRow : oddRow);
  return rows;
}

function phasesOf(frames: readonly { readonly phase: string }[]): string[] {
  const out: string[] = [];
  for (const frame of frames) out.push(frame.phase);
  return out;
}

describe('2020 Day 20 Part 2 solver', () => {
  it('solves the official 9-tile example with monsters policy', () => {
    expect(solver.policy.id).toBe('monsters');
    expect(solver.solve(solver.parse(EXAMPLE_9_TILES))).toBe(273n);
  });

  it('matches an independent local D4 15-offset oracle across global orientations', () => {
    const ocean = buildOcean24();
    const expected = referenceScan(ocean);
    expect([expected.monsterCount, expected.monsterCellCount]).toEqual([2, 26]);
    const seams = pickSeams(24);
    for (const globalOri of [0, 1, 4, 6]) {
      expect(solver.solve(solver.parse(formatScrambledPuzzle(applyD4(ocean, globalOri), seams, 3)))).toBe(BigInt(expected.waterRoughness));
    }
  });

  it('returns total hash count on sub-monster 2x2 and monster-free 3x3 puzzles', () => {
    expect(solver.solve(solver.parse(formatScrambledPuzzle(stripedOcean(16, '#'.repeat(16), '.'.repeat(16)), pickSeams(12), 2)))).toBe(128n);
    expect(solver.solve(solver.parse(formatScrambledPuzzle(stripedOcean(24, '.#'.repeat(12), '.'.repeat(24)), pickSeams(24), 3)))).toBe(144n);
  });

  it('produces bounded trace frames across default and capped maxSteps', () => {
    const parsed = solver.parse(EXAMPLE_9_TILES);
    const full = solver.trace(parsed);
    expect(full.length).toBe(11);
    expect([full[8]!.phase, full[9]!.phase, full[9]!.borderless]).toEqual(['assemble', 'stitch', true]);
    const last = full[10]!;
    expect([last.phase, last.borderless, last.pixelSide, last.monsterCount, last.waterRoughness]).toEqual(['monsters', true, 24, 2, 273]);
    let monsterCells = 0;
    for (let r = 0; r < last.pixelSide; r += 1) for (let c = 0; c < last.pixelSide; c += 1) {
      if (last.cellCodeAt(r, c) === 4) monsterCells += 1;
    }
    expect(monsterCells).toBe(30);
    expect(solver.trace(parsed, { maxSteps: 5 }).length).toBe(5);
    expect(phasesOf(solver.trace(parsed, { maxSteps: 2 }))).toEqual(['stitch', 'monsters']);
    expect(phasesOf(solver.trace(parsed, { maxSteps: 1 }))).toEqual(['monsters']);
  });

  it('throws on invalid inputs and non-positive maxSteps', () => {
    expect(() => solver.parse('')).toThrow();
    expect(() => solver.parse('Tile 1:\n...\n...\n...\n\nTile 2:\n...\n...\n...')).toThrow();
    expect(() => solver.trace(solver.parse(EXAMPLE_9_TILES), { maxSteps: 0 })).toThrow(RangeError);
  });
});
