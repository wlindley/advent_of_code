import { describe, expect, it } from 'vitest';
import { DisjointSet } from '../../../../shared/core';
import { compareJunctionPairs, parseJunctions, squaredDistance3D, type JunctionPair, type Point3D } from '../../shared';
import { connectUntilSingleCircuit, solver, traceFinalBridge } from './index';

const EXAMPLE = [
  '162,817,812', '57,618,57', '906,360,560', '592,479,940', '352,342,300',
  '466,668,158', '542,29,236', '431,825,988', '739,650,466', '52,470,668',
  '216,146,977', '819,987,18', '117,168,530', '805,96,715', '346,949,466',
  '970,615,88', '941,993,340', '862,61,35', '984,92,344', '425,690,689',
].join('\n');

function kruskalOracle(points: readonly Point3D[]): { mstEdges: JunctionPair[]; answer: bigint } {
  const pairs: JunctionPair[] = [];
  for (let u = 0; u < points.length; u += 1) {
    for (let v = u + 1; v < points.length; v += 1) pairs.push({ u, v, distSq: squaredDistance3D(points[u]!, points[v]!) });
  }
  pairs.sort(compareJunctionPairs);
  const dsu = new DisjointSet(points.length), mstEdges: JunctionPair[] = [];
  for (const p of pairs) {
    if (dsu.union(p.u, p.v)) { mstEdges.push(p); if (dsu.componentCount === 1) break; }
  }
  const last = mstEdges[mstEdges.length - 1]!;
  return { mstEdges, answer: BigInt(points[last.u]!.x) * BigInt(points[last.v]!.x) };
}

describe('2025/day08/part2 solver', () => {
  it('solves the official 20-box example and partitions pre-bridge sides', () => {
    const pts = solver.parse(EXAMPLE);
    expect(solver.solve(pts)).toBe(25272n);
    const res = connectUntilSingleCircuit(pts);
    expect(Object.isFrozen(res) && Object.isFrozen(res.mstEdges)).toBe(true);
    expect(res.finalEdge).toEqual({ u: 10, v: 12, distSq: squaredDistance3D(pts[10]!, pts[12]!) });
    expect(res.sideOf.length).toBe(20);
    expect([res.sideOf[10], res.sideOf[12]]).toEqual([0, 1]);
    expect(res.sideOf.every((s) => s === 0 || s === 1)).toBe(true);
  });

  it('handles minimal N=2, negative/zero coordinates, and >53-bit BigInt products', () => {
    const min = connectUntilSingleCircuit(parseJunctions('0,0,0\n3,4,5'));
    expect(min.answer).toBe(0n);
    expect([...min.sideOf]).toEqual([0, 1]);
    expect(connectUntilSingleCircuit(parseJunctions('-4,0,0\n5,0,0')).answer).toBe(-20n);
    expect(connectUntilSingleCircuit([{ x: 100_000_003, y: 0, z: 0 }, { x: 100_000_007, y: 0, z: 0 }]).answer).toBe(10000001000000021n);
  });

  it('rejects fewer than 2 points and invalid maxSteps', () => {
    expect(() => connectUntilSingleCircuit([])).toThrow(RangeError);
    expect(() => connectUntilSingleCircuit([{ x: 1, y: 2, z: 3 }])).toThrow(RangeError);
    const pts = solver.parse('0,0,0\n1,0,0');
    for (const bad of [0, -1, 1.5, NaN]) expect(() => traceFinalBridge(pts, { maxSteps: bad })).toThrow(RangeError);
  });

  it('matches Kruskal oracle on example, tied 3x3x3 cube, unit square + duplicates, and 60-point cloud', () => {
    const cube: Point3D[] = [];
    for (let x = 0; x < 3; x += 1) for (let y = 0; y < 3; y += 1) for (let z = 0; z < 3; z += 1) cube.push({ x, y, z });
    const tied = parseJunctions('1,1,0\n0,0,0\n1,0,0\n0,1,0\n0,0,0\n1,1,0');
    let seed = 0x12345678;
    const nextInt = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) % 2001) - 1000;
    const cloud: Point3D[] = Array.from({ length: 60 }, () => ({ x: nextInt(), y: nextInt(), z: nextInt() }));
    for (const pts of [solver.parse(EXAMPLE), cube, tied, cloud]) {
      const actual = connectUntilSingleCircuit(pts), expected = kruskalOracle(pts);
      expect(actual.answer).toBe(expected.answer);
      expect(actual.mstEdges).toEqual(expected.mstEdges);
    }
  });

  it('caps trace frames cleanly at maxSteps 1, 2, 5, and default', () => {
    const pts = solver.parse(EXAMPLE);
    expect(traceFinalBridge(pts, { maxSteps: 1 }).map((f) => [f.edgeCount, f.componentCount, f.isFinalBridge])).toEqual([[19, 1, true]]);
    expect(traceFinalBridge(pts, { maxSteps: 2 }).map((f) => [f.edgeCount, f.componentCount, f.isFinalBridge])).toEqual([[18, 2, false], [19, 1, true]]);
    const f5 = traceFinalBridge(pts, { maxSteps: 5 });
    expect(f5.map((f) => f.edgeCount)).toEqual([0, 6, 12, 18, 19]);
    expect(f5[0]!.lastEdge).toBeNull();
    expect(f5[0]!.edgeXProduct).toBeNull();
    expect(f5[4]!.edgeXProduct).toBe(25272n);
    expect(Object.isFrozen(f5) && Object.isFrozen(f5[0])).toBe(true);
    expect(solver.trace!(pts).length).toBe(20);
  });
});
