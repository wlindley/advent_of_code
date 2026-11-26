import { describe, expect, it } from 'vitest';
import { type Clock, executeSolver } from '../../../../shared/core';
import { solvePart2, solver } from './index';

const EXAMPLE_INPUT = [
  'kh-tc', 'qp-kh', 'de-cg', 'ka-co', 'yn-aq', 'qp-ub', 'cg-tb', 'vc-aq',
  'tb-ka', 'wh-tc', 'yn-cg', 'kh-ub', 'ta-co', 'de-co', 'tc-td', 'tb-wq',
  'wh-td', 'ta-ka', 'td-qp', 'aq-cg', 'wq-ub', 'ub-vc', 'de-ta', 'wq-aq',
  'wq-vc', 'wh-yn', 'ka-de', 'kh-ta', 'co-tc', 'wh-qp', 'tb-vc', 'td-yn',
].join('\n');

const UNSORTED_R_GRAPH = [
  'n0-n1', 'n0-n2', 'n0-n6', 'n1-n2', 'n1-n6', 'n2-n6',
  'n0-n3', 'n0-n4', 'n0-n5', 'n0-n7', 'n1-n3', 'n3-n4', 'n3-n5', 'n3-n7',
].join('\n');

class FakeClock implements Clock {
  private index = 0;
  private readonly ticks: readonly number[];
  constructor(ticks: readonly number[]) { this.ticks = ticks; }
  nowMs(): number { return this.ticks[this.index++]!; }
}

function parseOracleGraph(raw: string): { names: string[]; adj: number[] } {
  const edges = raw.trim().split('\n').map((line) => line.split('-'));
  const names = Array.from(new Set(edges.flat())).sort();
  const idByName = new Map(names.map((name, id) => [name, id]));
  const adj = new Array<number>(names.length).fill(0);
  for (const [a, b] of edges) {
    const u = idByName.get(a!)!;
    const v = idByName.get(b!)!;
    adj[u]! |= 1 << v;
    adj[v]! |= 1 << u;
  }
  return { names, adj };
}

function extractMaskNames(mask: number, names: readonly string[]): string[] {
  const result: string[] = [];
  for (let i = 0; i < names.length; i += 1) {
    if ((mask & (1 << i)) !== 0) result.push(names[i]!);
  }
  return result;
}

function compareNameTuples(a: readonly string[], b: readonly string[]): number {
  for (let i = 0; i < a.length; i += 1) {
    if (a[i]! !== b[i]!) return a[i]! < b[i]! ? -1 : 1;
  }
  return 0;
}

function oracleMaxClique(raw: string): string {
  const { names, adj } = parseOracleGraph(raw);
  const total = 1 << names.length;
  const isClique = new Uint8Array(total);
  const popcount = new Uint8Array(total);
  isClique[0] = 1;
  let bestSize = 0;
  let bestNames: string[] = [];
  for (let mask = 1; mask < total; mask += 1) {
    const lsb = mask & -mask;
    const v = 31 - Math.clz32(lsb);
    const rest = mask ^ lsb;
    const size = popcount[rest]! + 1;
    popcount[mask] = size;
    if (isClique[rest] && (adj[v]! & rest) === rest) {
      isClique[mask] = 1;
      if (size >= bestSize) {
        const candidate = extractMaskNames(mask, names);
        if (size > bestSize || compareNameTuples(candidate, bestNames) < 0) {
          bestSize = size;
          bestNames = candidate;
        }
      }
    }
  }
  return bestNames.join(',');
}

function buildSeededRawGraph(nodeCount: number, density: number, seed: number): string {
  let state = seed >>> 0;
  const edges: string[] = [];
  for (let u = 0; u < nodeCount; u += 1) {
    for (let v = u + 1; v < nodeCount; v += 1) {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      if (state / 0x100000000 < density) edges.push(`c${String(u).padStart(2, '0')}-c${String(v).padStart(2, '0')}`);
    }
  }
  if (edges.length === 0) edges.push('c00-c01');
  return edges.join('\n');
}

describe('Day 23 Part 2 solver', () => {
  it('solves the official example via direct, solver, and executeSolver', () => {
    const graph = solver.parse(EXAMPLE_INPUT);
    expect(solvePart2(graph)).toBe('co,de,ka,ta');
    expect(solver.solve(graph)).toBe('co,de,ka,ta');
    expect(oracleMaxClique(EXAMPLE_INPUT)).toBe('co,de,ka,ta');

    const execution = executeSolver(solver, EXAMPLE_INPUT, new FakeClock([10, 25]));
    expect(execution).toEqual({ answer: 'co,de,ka,ta', elapsedMs: 15, runtime: 'main-thread' });
  });

  it('matches oracle on single-edge, tied bowtie, disjoint, and unsorted-R graphs', () => {
    const cases = [
      ['aa-bb', 'aa,bb'],
      ['n0-n1\nn0-n2\nn1-n2\nn0-n3\nn0-n4\nn3-n4', 'n0,n1,n2'],
      ['cc-dd\naa-bb', 'aa,bb'],
      [UNSORTED_R_GRAPH, 'n0,n1,n2,n6'],
    ] as const;
    for (const [raw, expected] of cases) {
      expect(solver.solve(solver.parse(raw))).toBe(expected);
      expect(oracleMaxClique(raw)).toBe(expected);
    }
  });

  it('matches the bitmask DP oracle across 15 seeded random graphs', () => {
    const densities = [0.25, 0.5, 0.75];
    for (let i = 0; i < 15; i += 1) {
      const nodeCount = 6 + (i % 9);
      const raw = buildSeededRawGraph(nodeCount, densities[i % densities.length]!, 9001 + i * 7919);
      expect(solver.solve(solver.parse(raw))).toBe(oracleMaxClique(raw));
    }
  });

  it('produces bounded trace snapshots and rejects non-positive maxSteps', () => {
    const graph = solver.parse(EXAMPLE_INPUT);
    const full = solver.trace!(graph);
    expect(full).toHaveLength(3);
    expect(full[full.length - 1]!.isComplete).toBe(true);
    expect(full[full.length - 1]!.activeClique?.password).toBe('co,de,ka,ta');

    const capped = solver.trace!(graph, { maxSteps: 2 });
    expect(capped).toHaveLength(2);
    expect(capped[capped.length - 1]!.activeClique?.password).toBe('co,de,ka,ta');
    expect(() => solver.trace!(graph, { maxSteps: 0 })).toThrow(RangeError);
  });

  it('rejects empty, self-loop, and malformed inputs', () => {
    expect(() => solver.parse('')).toThrow(RangeError);
    expect(() => solver.parse('aa-aa')).toThrow(RangeError);
    expect(() => solver.parse('invalid_line')).toThrow(RangeError);
  });
});
