import { describe, expect, it } from 'vitest';
import { MinHeap } from '../../../shared/core';
import { CavernMap, PART1_POLICY, PART2_POLICY } from './cavern';
import { parseRiskGrid } from './parser';
import { findLowestRiskPath } from './pathfinder';

const EXAMPLE_INPUT = [
  '1163751742',
  '1381373672',
  '2136511328',
  '3694931569',
  '7463417111',
  '1319128137',
  '1359912421',
  '3125421639',
  '1293138521',
  '2311944581',
].join('\n');

function minHeapOracle(map: CavernMap): Int32Array {
  const dist = new Int32Array(map.cellCount).fill(0x7fffffff);
  const heap = new MinHeap<{ readonly idx: number; readonly d: number }>((a, b) => a.d - b.d);
  dist[0] = 0;
  heap.push({ idx: 0, d: 0 });
  const deltas = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ] as const;

  while (!heap.isEmpty) {
    const cur = heap.pop()!;
    if (cur.d > dist[cur.idx]!) continue;
    const r = Math.floor(cur.idx / map.cols);
    const c = cur.idx % map.cols;
    for (const [dr, dc] of deltas) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= map.rows || nc < 0 || nc >= map.cols) continue;
      const next = nr * map.cols + nc;
      const nd = cur.d + map.riskLevels[next]!;
      if (nd < dist[next]!) {
        dist[next] = nd;
        heap.push({ idx: next, d: nd });
      }
    }
  }
  return dist;
}

describe('findLowestRiskPath', () => {
  it('solves the 10x10 example for Part 1 (40) and Part 2 (315) with contiguous path', () => {
    const grid = parseRiskGrid(EXAMPLE_INPUT);
    const part1 = findLowestRiskPath(grid.expand(PART1_POLICY));
    expect(Object.isFrozen(part1)).toBe(true);
    expect(Object.isFrozen(part1.pathIndices)).toBe(true);
    expect(part1.totalRisk).toBe(40);
    expect(part1.stepCount).toBe(part1.pathLength - 1);
    expect(part1.pathIndices[0]).toBe(0);
    expect(part1.pathIndices[part1.pathLength - 1]).toBe(part1.map.goalIndex);

    let sum = 0;
    for (let i = 1; i < part1.pathIndices.length; i += 1) {
      const prev = part1.pathIndices[i - 1]!;
      const curr = part1.pathIndices[i]!;
      const dr = Math.abs(Math.floor(prev / 10) - Math.floor(curr / 10));
      const dc = Math.abs((prev % 10) - (curr % 10));
      expect(dr + dc).toBe(1);
      sum += part1.map.riskLevels[curr]!;
    }
    expect(sum).toBe(40);
    expect(part1.distanceAt(9, 9)).toBe(40);
    expect(part1.distances[0]).toBe(0);

    const part2 = findLowestRiskPath(grid.expand(PART2_POLICY));
    expect(part2.totalRisk).toBe(315);
  });

  it('handles 1x1, 1x5, 5x1, asymmetric maxDistance, and UP/LEFT detour grids', () => {
    const one = findLowestRiskPath(parseRiskGrid('9').expand(PART1_POLICY));
    expect(one.totalRisk).toBe(0);
    expect(one.maxDistance).toBe(0);
    expect(one.pathIndices).toEqual([0]);
    expect(one.stepCount).toBe(0);

    const row = findLowestRiskPath(parseRiskGrid('91234').expand(PART1_POLICY));
    expect(row.totalRisk).toBe(10);

    const col = findLowestRiskPath(parseRiskGrid('9\n2\n3\n4\n1').expand(PART1_POLICY));
    expect(col.totalRisk).toBe(10);

    const asym = findLowestRiskPath(parseRiskGrid('19\n11').expand(PART1_POLICY));
    expect(asym.totalRisk).toBe(2);
    expect(asym.maxDistance).toBe(9);

    // Requires both UP and LEFT moves around 2-column high-risk walls (total risk = 21).
    const spiral = parseRiskGrid([
      '1911111',
      '1919991',
      '1919911',
      '1919919',
      '1119919',
      '9999911',
    ].join('\n'));
    const spiralRes = findLowestRiskPath(spiral.expand(PART1_POLICY));
    expect(spiralRes.totalRisk).toBe(21);
    const hasUp = spiralRes.pathIndices.some(
      (idx, i) => i > 0 && idx === spiralRes.pathIndices[i - 1]! - 7,
    );
    const hasLeft = spiralRes.pathIndices.some(
      (idx, i) => i > 0 && idx === spiralRes.pathIndices[i - 1]! - 1,
    );
    expect(hasUp).toBe(true);
    expect(hasLeft).toBe(true);
  });

  it('matches MinHeap Dijkstra across 25 seeded PRNG grids and solves 100x100 in < 20ms', () => {
    let seed = 0x13579bdf;
    const nextInt = (max: number): number => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed % max;
    };

    for (let trial = 0; trial < 25; trial += 1) {
      const rows = 3 + nextInt(14);
      const cols = 3 + nextInt(14);
      const cells = Array.from({ length: rows * cols }, () => 1 + nextInt(9));
      const map = new CavernMap(rows, cols, 1, cells);
      const dial = findLowestRiskPath(map);
      const oracle = minHeapOracle(map);
      expect(dial.totalRisk).toBe(oracle[map.goalIndex]);
      for (let i = 0; i < map.cellCount; i += 1) {
        expect(dial.distances[i]).toBe(oracle[i]);
      }
    }

    const largeCells = Array.from({ length: 100 * 100 }, () => 1 + nextInt(9));
    const largeMap = new CavernMap(100, 100, 1, largeCells);
    const start = performance.now();
    const res = findLowestRiskPath(largeMap);
    const elapsedMs = performance.now() - start;
    expect(res.totalRisk).toBeGreaterThan(0);
    expect(elapsedMs).toBeLessThan(20);
  });
});
