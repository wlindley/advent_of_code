import { describe, expect, it } from 'vitest';
import { findRevisitedSmallCave, SINGLE_SMALL_REVISIT_POLICY } from '../../shared';
import { solver } from './index';

const EXAMPLE_1 = 'start-A\nstart-b\nA-c\nA-b\nb-d\nA-end\nb-end';
const EXAMPLE_2 =
  'dc-end\nHN-start\nstart-kj\ndc-start\ndc-HN\nLN-dc\nHN-end\nkj-sa\nkj-HN\nkj-dc';
const EXAMPLE_3 =
  'fs-end\nhe-DX\nfs-he\nstart-DX\npj-DX\nend-zg\nzg-sl\nzg-pj\npj-he\nRW-he\nfs-DX\npj-RW\nzg-RW\nstart-pj\nhe-WI\nzg-he\npj-fs\nstart-RW';

function parseRawAdjacency(raw: string): Map<string, string[]> {
  const adj = new Map<string, string[]>();
  for (const line of raw.trim().split('\n')) {
    const [a, b] = line.split('-');
    if (!a || !b) continue;
    adj.set(a, [...(adj.get(a) ?? []), b]);
    adj.set(b, [...(adj.get(b) ?? []), a]);
  }
  return adj;
}

function isRegularSmall(name: string): boolean {
  return name !== 'start' && name !== 'end' && /^[a-z]+$/.test(name);
}

function oracleDfs(
  adj: ReadonlyMap<string, readonly string[]>,
  current: string,
  counts: Map<string, number>,
  revisited: boolean,
): bigint {
  if (current === 'end') return 1n;
  let total = 0n;
  for (const next of adj.get(current) ?? []) {
    if (next === 'start') continue;
    if (!isRegularSmall(next)) {
      total += oracleDfs(adj, next, counts, revisited);
      continue;
    }
    const seen = counts.get(next) ?? 0;
    if (seen === 0 || !revisited) {
      counts.set(next, seen + 1);
      total += oracleDfs(adj, next, counts, revisited || seen === 1);
      counts.set(next, seen);
    }
  }
  return total;
}

function oracleSolvePart2(raw: string): bigint {
  return oracleDfs(parseRawAdjacency(raw), 'start', new Map<string, number>(), false);
}

function nextSeed(seed: number): number {
  return (Math.imul(seed, 1664525) + 1013904223) >>> 0;
}

function buildSeededRawGraph(seed: number): string {
  let s = nextSeed(seed);
  const smalls = ['a', 'b', 'c', 'd'].slice(0, 3 + (s % 2));
  s = nextSeed(s);
  const bigs = ['A', 'B'].slice(0, 1 + (s % 2));
  const nodes = ['start', 'end', ...smalls, ...bigs];
  const lines = [`start-${smalls[0]}`, `${smalls.at(-1)}-end`];
  const seen = new Set<string>([`${smalls[0]}-start`, `${smalls.at(-1)}-end`]);
  for (let i = 0; i < 12; i += 1) {
    s = nextSeed(s);
    const u = nodes[s % nodes.length]!;
    s = nextSeed(s);
    const v = nodes[s % nodes.length]!;
    if (u === v || (/^[A-Z]+$/.test(u) && /^[A-Z]+$/.test(v))) continue;
    const key = u < v ? `${u}-${v}` : `${v}-${u}`;
    if (!seen.has(key)) {
      seen.add(key);
      lines.push(`${u}-${v}`);
    }
  }
  return lines.join('\n');
}

describe('2021 Day 12 Part 2 solver', () => {
  it('solves the three official AoC examples under SINGLE_SMALL_REVISIT_POLICY', () => {
    expect(solver.policy).toBe(SINGLE_SMALL_REVISIT_POLICY);
    expect(solver.solve(solver.parse(EXAMPLE_1))).toBe(36n);
    expect(solver.solve(solver.parse(EXAMPLE_2))).toBe(103n);
    expect(solver.solve(solver.parse(EXAMPLE_3))).toBe(3509n);
  });

  it('handles degree-1 big-cave loops, multi-big loops, start/end limits, and disconnects', () => {
    expect(solver.solve(solver.parse('start-a\na-B\na-end'))).toBe(2n);
    expect(solver.solve(solver.parse('start-a\na-B\na-C\na-end'))).toBe(3n);
    expect(solver.solve(solver.parse('start-A\nstart-end\nB-end'))).toBe(1n);
    expect(solver.solve(solver.parse('start-a\nb-end'))).toBe(0n);
  });

  it('captures untruncated path-found traces with revisit tags and bounded summary traces', () => {
    const full = solver.trace(solver.parse('start-a\na-b\nb-c\na-c\nc-end'));
    const found: string[] = [];
    const revisited: (string | null)[] = [];
    for (const frame of full) {
      if (frame.status === 'path-found') {
        found.push(frame.path.join(','));
        revisited.push(findRevisitedSmallCave(frame.path));
      }
    }
    expect(full.at(-1)).toMatchObject({
      status: 'summary',
      truncated: false,
      totalPaths: 4n,
      discoveredPaths: 4,
    });
    expect(found).toEqual([
      'start,a,b,a,c,end',
      'start,a,b,c,end',
      'start,a,c,b,c,end',
      'start,a,c,end',
    ]);
    expect(revisited).toEqual(['a', null, 'c', null]);

    const sys1 = solver.parse(EXAMPLE_1);
    for (const maxSteps of [1, 12]) {
      const capped = solver.trace(sys1, { maxSteps });
      expect(capped).toHaveLength(maxSteps);
      expect(capped.at(-1)).toMatchObject({ status: 'summary', truncated: true, totalPaths: 36n });
    }
  });

  it('rejects invalid cave inputs and invalid maxSteps options', () => {
    for (const bad of ['', 'start_end', 'start-A\nA-B\nB-end', 'start-a', 'start-a\na-a\na-end']) {
      expect(() => solver.parse(bad)).toThrow();
    }
    const sys = solver.parse(EXAMPLE_1);
    for (const maxSteps of [0, -1, 1.5, Number.NaN]) {
      expect(() => solver.trace(sys, { maxSteps })).toThrow();
    }
  });

  it('matches an independent raw-string DFS oracle across 30 seeded random graphs', () => {
    for (let i = 1; i <= 30; i += 1) {
      const raw = buildSeededRawGraph(i * 7919);
      expect(solver.solve(solver.parse(raw))).toBe(oracleSolvePart2(raw));
    }
  });
});
