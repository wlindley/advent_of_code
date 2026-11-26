import { describe, expect, it } from 'vitest';
import { EMPTY_CELL, type AntennaMap } from '../../shared';
import { solvePart1, solver, tracePart1 } from './solver';

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

function createPrng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function pairHashSetOracle(raw: string): number {
  const lines = raw.split('\n');
  const rows = lines.length;
  const cols = lines[0]!.length;
  const groups = new Map<string, [number, number][]>();
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const ch = lines[r]![c]!;
      if (ch === EMPTY_CELL) continue;
      const arr = groups.get(ch) ?? [];
      arr.push([r, c]);
      groups.set(ch, arr);
    }
  }
  const seen = new Set<string>();
  for (const pts of groups.values()) {
    for (let i = 0; i < pts.length; i += 1) {
      for (let j = i + 1; j < pts.length; j += 1) {
        const [r1, c1] = pts[i]!;
        const [r2, c2] = pts[j]!;
        for (const [ar, ac] of [
          [2 * r1 - r2, 2 * c1 - c2],
          [2 * r2 - r1, 2 * c2 - c1],
        ] as const) {
          if (ar >= 0 && ar < rows && ac >= 0 && ac < cols) seen.add(`${ar},${ac}`);
        }
      }
    }
  }
  return seen.size;
}

function cellCentricOracle(map: AntennaMap): number {
  const antennas: [number, number, string][] = [];
  for (let r = 0; r < map.rows; r += 1) {
    for (let c = 0; c < map.cols; c += 1) {
      const ch = map.cellAt(r, c);
      if (ch !== EMPTY_CELL) antennas.push([r, c, ch]);
    }
  }
  let count = 0;
  for (let r = 0; r < map.rows; r += 1) {
    for (let c = 0; c < map.cols; c += 1) {
      let isAntinode = false;
      for (const [ar, ac, freq] of antennas) {
        if (ar === r && ac === c) continue;
        const br = 2 * ar - r;
        const bc = 2 * ac - c;
        if (map.inBounds(br, bc) && map.cellAt(br, bc) === freq) {
          isAntinode = true;
          break;
        }
      }
      if (isAntinode) count += 1;
    }
  }
  return count;
}

function buildSeededGrid(rand: () => number, index: number): string {
  const rows = index === 0 ? 1 : 1 + Math.floor(rand() * 25);
  const cols = index === 0 ? 1 : 1 + Math.floor(rand() * 25);
  const poolSize = 1 + Math.floor(rand() * 8);
  const pool = Array.from({ length: poolSize }, () => ALPHABET[Math.floor(rand() * ALPHABET.length)]!);
  const density = index % 5 === 0 ? 0.35 : 0.16;
  const grid = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => (rand() < density ? pool[Math.floor(rand() * pool.length)]! : '.')),
  );
  // Inject occasional collinear clusters for dense tie/overlap testing.
  if (rows >= 5 && cols >= 5 && index % 4 === 0) {
    const ch = pool[0]!;
    for (let k = 0; k < 4; k += 1) grid[k]![k] = ch;
  }
  return grid.map((row) => row.join('')).join('\n');
}

describe('2024 Day 8 Part 1 independent cross-validation oracles', () => {
  it('matches both pair-hashset and cell-centric oracles and trace uniqueCount across 80 seeded grids', () => {
    const rand = createPrng(20241208);
    for (let i = 0; i < 80; i += 1) {
      const raw = buildSeededGrid(rand, i);
      const map = solver.parse(raw);
      const actual = solvePart1(map);
      expect(actual).toBe(pairHashSetOracle(raw));
      expect(actual).toBe(cellCentricOracle(map));

      const frames = tracePart1(map, { maxSteps: 12 });
      if (map.totalPairs === 0) expect(frames).toHaveLength(0);
      else expect(frames[frames.length - 1]!.uniqueCount).toBe(actual);
    }
  });
});
