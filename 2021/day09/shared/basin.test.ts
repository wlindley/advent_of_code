import { describe, expect, it } from 'vitest';
import { DIRS_4, DisjointSet } from '../../../shared/core';
import { analyzeHeightmap, Basin, HeightmapAnalysis, LowPoint } from './basin';
import type { Heightmap } from './heightmap';
import { parseHeightmap } from './parser';

const OFFICIAL_EXAMPLE = ['2199943210', '3987894921', '9856789892', '8767896789', '9899965678'].join('\n');

function makePrng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function oracleLowPoints(map: Heightmap): LowPoint[] {
  const result: LowPoint[] = [];
  for (let r = 0; r < map.rows; r += 1) {
    for (let c = 0; c < map.cols; c += 1) {
      const h = map.at(r, c);
      const strictlyLowest = DIRS_4.every(([dr, dc]) => !map.inBounds(r + dr, c + dc) || map.at(r + dr, c + dc) > h);
      if (strictlyLowest) result.push(new LowPoint(r, c, h));
    }
  }
  return result;
}

function oracleDisjointSetSizes(map: Heightmap): number[] {
  const dsu = new DisjointSet(map.size);
  const nonRidge: number[] = [];
  for (let r = 0; r < map.rows; r += 1) {
    for (let c = 0; c < map.cols; c += 1) {
      if (map.isRidge(r, c)) continue;
      const idx = r * map.cols + c;
      nonRidge.push(idx);
      if (r + 1 < map.rows && !map.isRidge(r + 1, c)) dsu.union(idx, (r + 1) * map.cols + c);
      if (c + 1 < map.cols && !map.isRidge(r, c + 1)) dsu.union(idx, r * map.cols + c + 1);
    }
  }
  const seenRoots = new Set<number>();
  const sizes: number[] = [];
  for (const idx of nonRidge) {
    const root = dsu.find(idx);
    if (!seenRoots.has(root)) { seenRoots.add(root); sizes.push(dsu.sizeOf(root)); }
  }
  return sizes.sort((a, b) => a - b);
}

function oracleDfsSizes(map: Heightmap): number[] {
  const visited = new Set<string>();
  const sizes: number[] = [];
  for (let r = 0; r < map.rows; r += 1) {
    for (let c = 0; c < map.cols; c += 1) {
      const key = `${r},${c}`;
      if (map.isRidge(r, c) || visited.has(key)) continue;
      const stack: [number, number][] = [[r, c]];
      visited.add(key);
      let size = 0;
      while (stack.length > 0) {
        const [cr, cc] = stack.pop()!;
        size += 1;
        for (const [dr, dc] of DIRS_4) {
          const [nr, nc] = [cr + dr, cc + dc];
          const nKey = `${nr},${nc}`;
          if (map.inBounds(nr, nc) && !map.isRidge(nr, nc) && !visited.has(nKey)) {
            visited.add(nKey);
            stack.push([nr, nc]);
          }
        }
      }
      sizes.push(size);
    }
  }
  return sizes.sort((a, b) => a - b);
}

describe('analyzeHeightmap & HeightmapAnalysis', () => {
  it('solves the official 5x10 example with exact risk level and basin sizes', () => {
    const analysis = analyzeHeightmap(parseHeightmap(OFFICIAL_EXAMPLE));
    expect(analysis).toBeInstanceOf(HeightmapAnalysis);
    expect(Object.isFrozen(analysis)).toBe(true);
    expect(analysis.totalRiskLevel).toBe(15);
    expect(analysis.basins.map((b: Basin) => b.size)).toEqual([3, 9, 14, 9]);
    expect(analysis.maxWaveDepth).toBeGreaterThan(0);
    expect(analysis.basinIdAt(0, 2)).toBeNull();
    expect(analysis.waveDepthAt(0, 2)).toBeNull();
    expect(analysis.basinIdAt(0, 1)).toBe(0);
    expect(analysis.waveDepthAt(0, 1)).toBe(0);
    expect(() => analysis.basinIdAt(-1, 0)).toThrow(RangeError);
    expect(() => analysis.waveDepthAt(5, 0)).toThrow(RangeError);
  });

  it('handles edge topologies (1x1 [0], 1x1 [9], all-9, all-0, multi-minima 152, mixed 0922)', () => {
    const oneZero = analyzeHeightmap(parseHeightmap('0'));
    expect(oneZero.totalRiskLevel).toBe(1);
    expect(oneZero.basins.map((b) => b.size)).toEqual([1]);
    const oneNine = analyzeHeightmap(parseHeightmap('9'));
    expect(oneNine.totalRiskLevel).toBe(10);
    expect(oneNine.basins).toHaveLength(0);
    expect(oneNine.maxWaveDepth).toBe(-1);
    const allNine = analyzeHeightmap(parseHeightmap('99\n99'));
    expect(allNine.lowPoints).toHaveLength(0);
    expect(allNine.totalRiskLevel).toBe(0);
    expect(allNine.maxWaveDepth).toBe(-1);
    const allZero = analyzeHeightmap(parseHeightmap('00\n00'));
    expect(allZero.lowPoints).toHaveLength(0);
    expect(allZero.basins.map((b) => b.size)).toEqual([4]);
    const multiMin = analyzeHeightmap(parseHeightmap('152'));
    expect(multiMin.lowPoints.map((lp) => lp.col)).toEqual([0, 2]);
    expect(multiMin.basins[0]!.lowPoints.map((lp) => lp.col)).toEqual([0, 2]);
    const mixed = analyzeHeightmap(parseHeightmap('0922'));
    expect(mixed.lowPoints.map((lp) => lp.col)).toEqual([0]);
    expect(mixed.basins.map((b) => b.size)).toEqual([1, 2]);
  });

  it('matches brute-force, DisjointSet percolation, and Set DFS oracles across 40 seeded PRNG grids', () => {
    const rand = makePrng(20210901);
    for (let trial = 0; trial < 40; trial += 1) {
      const rows = 1 + Math.floor(rand() * 12);
      const cols = 1 + Math.floor(rand() * 12);
      const raw = Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => String(rand() < 0.28 ? 9 : Math.floor(rand() * 9))).join(''),
      ).join('\n');
      const map = parseHeightmap(raw);
      const analysis = analyzeHeightmap(map);
      const expectedLow = oracleLowPoints(map);
      expect(analysis.lowPoints.map((lp) => [lp.row, lp.col, lp.height])).toEqual(
        expectedLow.map((lp) => [lp.row, lp.col, lp.height]),
      );
      expect(analysis.totalRiskLevel).toBe(expectedLow.reduce((acc, lp) => acc + lp.riskLevel, 0));
      const actualSizes = analysis.basins.map((b) => b.size).sort((a, b) => a - b);
      expect(actualSizes).toEqual(oracleDisjointSetSizes(map));
      expect(actualSizes).toEqual(oracleDfsSizes(map));
    }
  });
});
