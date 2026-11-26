import { describe, expect, it } from 'vitest';
import { DIRS_4, DisjointSet } from '../../../../shared/core';
import { BasinFloodFrame, type Heightmap } from '../../shared';
import { solver } from './index';

const OFFICIAL_EXAMPLE = ['2199943210', '3987894921', '9856789892', '8767896789', '9899965678'].join('\n');

function nextRng(seed: number): number {
  return (Math.imul(seed, 1664525) + 1013904223) >>> 0;
}

function generateRandomHeightmap(initialSeed: number): { raw: string; nextSeed: number } {
  let s = nextRng(initialSeed);
  const rows = 3 + (s % 7);
  s = nextRng(s);
  const cols = 3 + (s % 7);
  const lines: string[] = [];
  for (let r = 0; r < rows; r += 1) {
    let line = '';
    for (let c = 0; c < cols; c += 1) {
      s = nextRng(s);
      line += s % 4 === 0 ? '9' : String((s >>> 3) % 9);
    }
    lines.push(line);
  }
  return { raw: lines.join('\n'), nextSeed: s };
}

function oracleDisjointSetSizes(map: Heightmap): number[] {
  const dsu = new DisjointSet(map.size);
  for (let r = 0; r < map.rows; r += 1) {
    for (let c = 0; c < map.cols; c += 1) {
      if (map.isRidge(r, c)) continue;
      const idx = r * map.cols + c;
      if (r + 1 < map.rows && !map.isRidge(r + 1, c)) dsu.union(idx, (r + 1) * map.cols + c);
      if (c + 1 < map.cols && !map.isRidge(r, c + 1)) dsu.union(idx, r * map.cols + (c + 1));
    }
  }
  const seenRoots = new Set<number>();
  const sizes: number[] = [];
  for (let r = 0; r < map.rows; r += 1) {
    for (let c = 0; c < map.cols; c += 1) {
      if (map.isRidge(r, c)) continue;
      const root = dsu.find(r * map.cols + c);
      if (!seenRoots.has(root)) {
        seenRoots.add(root);
        sizes.push(dsu.sizeOf(root));
      }
    }
  }
  return sizes;
}

function floodCountDfs(map: Heightmap, startRow: number, startCol: number, visited: Set<string>): number {
  const stack: [number, number][] = [[startRow, startCol]];
  visited.add(`${startRow},${startCol}`);
  let count = 0;
  while (stack.length > 0) {
    const [r, c] = stack.pop()!;
    count += 1;
    for (const [dr, dc] of DIRS_4) {
      const nr = r + dr;
      const nc = c + dc;
      const key = `${nr},${nc}`;
      if (map.inBounds(nr, nc) && !map.isRidge(nr, nc) && !visited.has(key)) {
        visited.add(key);
        stack.push([nr, nc]);
      }
    }
  }
  return count;
}

function oracleDfsSizes(map: Heightmap): number[] {
  const visited = new Set<string>();
  const sizes: number[] = [];
  for (let r = 0; r < map.rows; r += 1) {
    for (let c = 0; c < map.cols; c += 1) {
      if (!map.isRidge(r, c) && !visited.has(`${r},${c}`)) {
        sizes.push(floodCountDfs(map, r, c, visited));
      }
    }
  }
  return sizes;
}

function topThreeProduct(sizes: readonly number[]): number | null {
  if (sizes.length < 3) return null;
  const sorted = sizes.slice().sort((a, b) => b - a);
  return sorted[0]! * sorted[1]! * sorted[2]!;
}

describe('2021 Day 9 Part 2 solver', () => {
  it('solves the official 5x10 example to 1134 with expected full and bounded traces', () => {
    const map = solver.parse(OFFICIAL_EXAMPLE);
    expect(solver.solve(map)).toBe(1134);
    const full = solver.trace(map) as readonly BasinFloodFrame[];
    expect(full).toHaveLength(5);
    expect(full.map((f) => f.waveDepth)).toEqual([0, 1, 2, 3, 4]);
    const finalFrame = full[full.length - 1]!;
    expect(finalFrame.topBasins.map((b) => b.revealedSize)).toEqual([14, 9, 9]);
    expect(finalFrame.runningTotal).toBe(1134);

    const bounded3 = solver.trace(map, { maxSteps: 3 }) as readonly BasinFloodFrame[];
    expect(bounded3.map((f) => f.waveDepth)).toEqual([0, 2, 4]);
    expect(bounded3[bounded3.length - 1]!.runningTotal).toBe(1134);

    const bounded1 = solver.trace(map, { maxSteps: 1 }) as readonly BasinFloodFrame[];
    expect(bounded1.map((f) => f.waveDepth)).toEqual([4]);
    expect(bounded1[0]!.runningTotal).toBe(1134);
  });

  it('handles ties deterministically and handles depth-0, plateau, and multi-minima basins', () => {
    expect(solver.solve(solver.parse('0000009000090009000'))).toBe(72);

    const equalTies = solver.parse('01901901901');
    expect(solver.solve(equalTies)).toBe(8);
    const equalFrames = solver.trace(equalTies) as readonly BasinFloodFrame[];
    expect(equalFrames[equalFrames.length - 1]!.topBasins.map((b) => b.basinId)).toEqual([0, 1, 2]);

    const depthZero = solver.trace(solver.parse('09090')) as readonly BasinFloodFrame[];
    expect(depthZero).toHaveLength(1);
    expect(depthZero[0]!.waveDepth).toBe(0);
    expect(depthZero[0]!.revealedCellCount).toBe(3);
    expect(depthZero[0]!.runningTotal).toBe(1);

    expect(solver.solve(solver.parse('00911922'))).toBe(8);
    expect(solver.solve(solver.parse('1529091'))).toBe(3);
  });

  it('rejects maps with fewer than 3 basins, invalid maxSteps, and malformed inputs', () => {
    for (const raw of ['9', '99\n99', '0', '090']) {
      const map = solver.parse(raw);
      expect(() => solver.solve(map)).toThrow(RangeError);
      expect(() => solver.trace(map)).toThrow(RangeError);
    }
    const valid = solver.parse(OFFICIAL_EXAMPLE);
    for (const badSteps of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => solver.trace(valid, { maxSteps: badSteps })).toThrow(RangeError);
    }
    for (const badRaw of ['', '12\n3', '12x']) {
      expect(() => solver.parse(badRaw)).toThrow();
    }
  });

  it('matches DSU and DFS differential oracles across 35 seeded PRNG grids', () => {
    let seed = 0x20210902;
    for (let i = 0; i < 35; i += 1) {
      const { raw, nextSeed } = generateRandomHeightmap(seed);
      seed = nextSeed;
      const map = solver.parse(raw);
      const expectedDsu = topThreeProduct(oracleDisjointSetSizes(map));
      const expectedDfs = topThreeProduct(oracleDfsSizes(map));
      expect(expectedDsu).toBe(expectedDfs);
      if (expectedDsu === null) {
        expect(() => solver.solve(map)).toThrow(RangeError);
        expect(() => solver.trace(map)).toThrow(RangeError);
      } else {
        expect(solver.solve(map)).toBe(expectedDsu);
        const frames = solver.trace(map) as readonly BasinFloodFrame[];
        expect(frames[frames.length - 1]!.runningTotal).toBe(expectedDsu);
      }
    }
  });
});
