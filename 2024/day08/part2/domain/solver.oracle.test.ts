import { describe, expect, it } from 'vitest';
import { EMPTY_CELL, type AntennaMap } from '../../shared';
import { solvePart2, solver, tracePart2 } from './index';

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

class SeededPrng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  next(): number {
    this.state = (Math.imul(1664525, this.state) + 1013904223) >>> 0;
    return this.state / 0x100000000;
  }
}

function isCollinearWithAnyPair(
  row: number,
  col: number,
  groups: ReadonlyMap<string, readonly [number, number][]>,
): boolean {
  for (const pts of groups.values()) {
    for (let i = 0; i < pts.length; i += 1) {
      const [ar, ac] = pts[i]!;
      for (let j = i + 1; j < pts.length; j += 1) {
        const [br, bc] = pts[j]!;
        if ((row - ar) * (bc - ac) === (col - ac) * (br - ar)) return true;
      }
    }
  }
  return false;
}

function crossProductOracle(map: AntennaMap): number {
  const groups = new Map<string, [number, number][]>();
  for (let r = 0; r < map.rows; r += 1) {
    for (let c = 0; c < map.cols; c += 1) {
      const ch = map.cellAt(r, c);
      if (ch === EMPTY_CELL) continue;
      const list = groups.get(ch) ?? [];
      list.push([r, c]);
      groups.set(ch, list);
    }
  }
  let count = 0;
  for (let r = 0; r < map.rows; r += 1) {
    for (let c = 0; c < map.cols; c += 1) {
      if (isCollinearWithAnyPair(r, c, groups)) count += 1;
    }
  }
  return count;
}

function buildSeededGrid(prng: SeededPrng, index: number): string {
  const rows = index === 0 ? 1 : 1 + Math.floor(prng.next() * 25);
  const cols = index === 0 ? 1 : 1 + Math.floor(prng.next() * 25);
  const poolSize = 1 + Math.floor(prng.next() * 8);
  const pool = Array.from({ length: poolSize }, () => ALPHABET[Math.floor(prng.next() * ALPHABET.length)]!);
  const density = index % 5 === 0 ? 0.35 : 0.16;
  const grid = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => (prng.next() < density ? pool[Math.floor(prng.next() * pool.length)]! : '.')),
  );
  if (rows >= 5 && cols >= 5 && index % 4 === 0) {
    grid[0]![0] = pool[0]!;
    grid[4]![2] = pool[0]!;
  }
  return grid.map((row) => row.join('')).join('\n');
}

const T_EXAMPLE = [
  'T.........',
  '...T......',
  '.T........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
].join('\n');

const OFFICIAL_EXAMPLE = [
  '............',
  '........0...',
  '.....0......',
  '.......0....',
  '....0.......',
  '......A.....',
  '............',
  '............',
  '........A...',
  '.........A..',
  '............',
  '............',
].join('\n');

describe('2024 Day 8 Part 2 Euclidean cross-product oracle', () => {
  it('matches official examples (9, 34) and non-coprime/axis-aligned/multi-frequency grids', () => {
    const tMap = solver.parse(T_EXAMPLE);
    expect(solvePart2(tMap)).toBe(9);
    expect(crossProductOracle(tMap)).toBe(9);

    const officialMap = solver.parse(OFFICIAL_EXAMPLE);
    expect(solvePart2(officialMap)).toBe(34);
    expect(crossProductOracle(officialMap)).toBe(34);

    for (const raw of ['a...a\n.....\nB...B', 'x....\n.....\n..x..\n.....\n....x', '0..0\n1..1\n0..0']) {
      const map = solver.parse(raw);
      expect(solvePart2(map)).toBe(crossProductOracle(map));
    }
  });

  it('matches cross-product oracle and trace uniqueCount across 60 seeded grids', () => {
    const prng = new SeededPrng(202412082);
    for (let i = 0; i < 60; i += 1) {
      const map = solver.parse(buildSeededGrid(prng, i));
      const actual = solvePart2(map);
      expect(actual).toBe(crossProductOracle(map));

      const frames = tracePart2(map, { maxSteps: 10 });
      if (map.totalPairs === 0) expect(frames).toHaveLength(0);
      else expect(frames[frames.length - 1]!.uniqueCount).toBe(actual);
    }
  });
});
