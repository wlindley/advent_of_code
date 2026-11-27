import { describe, expect, it } from 'vitest';
import {
  CavePathSolver,
  CaveSystem,
  classifyCave,
  END_CAVE,
  NO_REVISIT_POLICY,
  SINGLE_SMALL_REVISIT_POLICY,
  START_CAVE,
  type CaveEdge,
} from '../../shared';
import { solver } from './solver';

function oracleDfs(
  system: CaveSystem,
  current: string,
  smallCounts: Map<string, number>,
  allowRevisit: boolean,
  usedRevisit: boolean,
): bigint {
  if (current === END_CAVE) return 1n;
  let total = 0n;
  for (const next of system.neighborsOf(current)) {
    if (next === START_CAVE) continue;
    if (classifyCave(next) !== 'small') {
      total += oracleDfs(system, next, smallCounts, allowRevisit, usedRevisit);
      continue;
    }
    const visits = smallCounts.get(next) ?? 0;
    if (visits === 0) {
      smallCounts.set(next, 1);
      total += oracleDfs(system, next, smallCounts, allowRevisit, usedRevisit);
      smallCounts.set(next, 0);
    } else if (allowRevisit && !usedRevisit) {
      smallCounts.set(next, visits + 1);
      total += oracleDfs(system, next, smallCounts, allowRevisit, true);
      smallCounts.set(next, visits);
    }
  }
  return total;
}

function oracleSolve(system: CaveSystem, allowRevisit: boolean): bigint {
  return oracleDfs(system, START_CAVE, new Map<string, number>(), allowRevisit, false);
}

function nextSeed(seed: number): number {
  return (Math.imul(seed, 1664525) + 1013904223) >>> 0;
}

function tryAddEdge(
  edges: CaveEdge[],
  seen: Set<string>,
  a: string,
  b: string,
): void {
  if (a === b) return;
  if (classifyCave(a) === 'big' && classifyCave(b) === 'big') return;
  const key = a < b ? `${a}-${b}` : `${b}-${a}`;
  if (seen.has(key)) return;
  seen.add(key);
  edges.push({ a, b });
}

function buildSeededCaveSystem(initialSeed: number): CaveSystem {
  let s = initialSeed;
  s = nextSeed(s);
  const smallPool = ['a', 'b', 'c', 'd', 'e', 'f'].slice(0, 3 + (s % 4));
  s = nextSeed(s);
  const bigPool = ['A', 'B', 'C'].slice(0, 1 + (s % 3));
  const vertices = [START_CAVE, END_CAVE, ...smallPool, ...bigPool];
  const edges: CaveEdge[] = [];
  const seen = new Set<string>();

  tryAddEdge(edges, seen, START_CAVE, smallPool[0]!);
  tryAddEdge(edges, seen, smallPool.at(-1)!, END_CAVE);
  for (let attempt = 0; attempt < 18; attempt += 1) {
    s = nextSeed(s);
    const u = vertices[s % vertices.length]!;
    s = nextSeed(s);
    const v = vertices[s % vertices.length]!;
    tryAddEdge(edges, seen, u, v);
  }
  return new CaveSystem(edges);
}

const REFERENCE_GRAPHS = [
  'start-A\nstart-b\nA-c\nA-b\nb-d\nA-end\nb-end',
  'dc-end\nHN-start\nstart-kj\ndc-start\ndc-HN\nLN-dc\nHN-end\nkj-sa\nkj-HN\nkj-dc',
  'fs-end\nhe-DX\nfs-he\nstart-DX\npj-DX\nend-zg\nzg-sl\nzg-pj\npj-he\nRW-he\nfs-DX\npj-RW\nzg-RW\nstart-pj\nhe-WI\nzg-he\npj-fs\nstart-RW',
  'start-b\nb-A\nb-end',
  'start-b\nb-A\nb-B\nb-end',
  'start-A\nstart-end\nB-end',
];

describe('CavePathSolver differential oracle', () => {
  const part2Solver = new CavePathSolver(SINGLE_SMALL_REVISIT_POLICY);

  it('matches independent raw-graph backtracking across AoC examples and degree-1 big-cave edge cases', () => {
    for (const raw of REFERENCE_GRAPHS) {
      const system = solver.parse(raw);
      expect(solver.solve(system)).toBe(oracleSolve(system, false));
      expect(part2Solver.solve(system)).toBe(oracleSolve(system, true));
    }
    expect(solver.policy).toBe(NO_REVISIT_POLICY);
  });

  it('matches independent backtracking across 35 seeded random valid cave graphs', () => {
    for (let idx = 1; idx <= 35; idx += 1) {
      const system = buildSeededCaveSystem(idx * 7919);
      expect(solver.solve(system)).toBe(oracleSolve(system, false));
      expect(part2Solver.solve(system)).toBe(oracleSolve(system, true));
    }
  });
});
