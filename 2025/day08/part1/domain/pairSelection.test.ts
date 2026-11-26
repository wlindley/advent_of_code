import { describe, expect, it } from 'vitest';
import { compareJunctionPairs, squaredDistance3D, type JunctionPair, type Point3D } from '../../shared';
import { selectClosestPairs } from './pairSelection';

function fullSortOracle(points: readonly Point3D[], pairCount: number): readonly JunctionPair[] {
  const all: JunctionPair[] = [];
  for (let u = 0; u < points.length - 1; u += 1) {
    for (let v = u + 1; v < points.length; v += 1) {
      all.push({ u, v, distSq: squaredDistance3D(points[u]!, points[v]!) });
    }
  }
  all.sort(compareJunctionPairs);
  return all.slice(0, pairCount);
}

describe('selectClosestPairs', () => {
  it('handles edge cases: pairCount=0, N=0, N=1, pairCount=1, and pairCount > totalPairs', () => {
    const pts: Point3D[] = [{ x: 0, y: 0, z: 0 }, { x: 3, y: 4, z: 0 }, { x: 1, y: 0, z: 0 }];
    expect(selectClosestPairs(pts, 0)).toEqual([]);
    expect(selectClosestPairs([], 5)).toEqual([]);
    expect(selectClosestPairs([{ x: 1, y: 2, z: 3 }], 5)).toEqual([]);
    expect(selectClosestPairs(pts, 1)).toEqual([{ u: 0, v: 2, distSq: 1 }]);
    expect(selectClosestPairs(pts, 99)).toEqual(fullSortOracle(pts, 99));
  });

  it('rejects invalid pairCount and coordinate spans exceeding safe integer squared distances', () => {
    const pts: Point3D[] = [{ x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1 }];
    for (const bad of [-1, 1.5, Number.NaN, Infinity]) {
      expect(() => selectClosestPairs(pts, bad)).toThrow(RangeError);
    }
    expect(() =>
      selectClosestPairs([{ x: 0, y: 0, z: 0 }, { x: 100_000_000, y: 0, z: 0 }], 1),
    ).toThrow(RangeError);
  });

  it('breaks ties deterministically by (distSq, u, v) on a unit cube', () => {
    const cube: Point3D[] = [];
    for (let x = 0; x <= 1; x += 1) {
      for (let y = 0; y <= 1; y += 1) {
        for (let z = 0; z <= 1; z += 1) {
          cube.push({ x, y, z });
        }
      }
    }
    expect(selectClosestPairs(cube, 14)).toEqual(fullSortOracle(cube, 14));
  });

  it('matches full-pair-sort differential oracle on deterministic LCG clouds', () => {
    let seed = 0x12345678;
    const nextInt = (bound: number): number => {
      seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
      return seed % bound;
    };
    const cloud: Point3D[] = Array.from({ length: 40 }, () => ({
      x: nextInt(500) - 250,
      y: nextInt(500) - 250,
      z: nextInt(500) - 250,
    }));

    for (const k of [1, 5, 20, 100, 780]) {
      expect(selectClosestPairs(cloud, k)).toEqual(fullSortOracle(cloud, k));
    }
  });
});
