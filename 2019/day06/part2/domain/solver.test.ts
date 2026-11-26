import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { DEFAULT_MAX_TRACE_STEPS, SANTA_TRANSFER_POLICY, type OrbitTraceFrame, type TransferTraceFrame } from '../../shared';
import { solver } from './index';

const EXAMPLE_INPUT = 'COM)B\nB)C\nC)D\nD)E\nE)F\nB)G\nG)H\nD)I\nE)J\nJ)K\nK)L\nK)YOU\nI)SAN';

function asTransfer(frame: OrbitTraceFrame): TransferTraceFrame {
  expect(frame.kind).toBe('transfer');
  return frame as TransferTraceFrame;
}

function buildDeepChain(depth: number): string {
  const lines = Array.from({ length: depth }, (_, i) => `${i === 0 ? 'COM' : `N${i}`})N${i + 1}`);
  lines.push('COM)YOU', `N${depth})SAN`);
  return lines.join('\n');
}

function nextPrng(state: number): number {
  return (Math.imul(state, 1664525) + 1013904223) >>> 0;
}

function generateRandomTree(seed: number): { raw: string; edges: [string, string][]; nextSeed: number } {
  let s = nextPrng(seed);
  const n = 5 + (s % 20);
  s = nextPrng(s);
  const youIdx = 1 + (s % (n - 1));
  s = nextPrng(s);
  const sanRaw = 1 + (s % (n - 2));
  const sanIdx = sanRaw >= youIdx ? sanRaw + 1 : sanRaw;
  const labels = Array.from({ length: n }, (_, i) =>
    i === 0 ? 'COM' : i === youIdx ? 'YOU' : i === sanIdx ? 'SAN' : `N${i}`,
  );
  const edges: [string, string][] = [];
  for (let i = 1; i < n; i += 1) {
    s = nextPrng(s);
    edges.push([labels[s % i]!, labels[i]!]);
  }
  return { raw: edges.map(([p, c]) => `${p})${c}`).join('\n'), edges, nextSeed: s };
}

function bfsOraclePath(edges: readonly [string, string][]): string[] {
  const adj = new Map<string, string[]>();
  let start = '';
  let goal = '';
  for (const [p, c] of edges) {
    if (c === 'YOU') start = p;
    if (c === 'SAN') goal = p;
    adj.set(p, [...(adj.get(p) ?? []), c]);
    adj.set(c, [...(adj.get(c) ?? []), p]);
  }
  const prev = new Map<string, string | null>([[start, null]]);
  const queue = [start];
  for (let head = 0; head < queue.length; head += 1) {
    const cur = queue[head]!;
    if (cur === goal) break;
    for (const next of adj.get(cur) ?? []) {
      if (!prev.has(next)) { prev.set(next, cur); queue.push(next); }
    }
  }
  const path: string[] = [];
  for (let cur: string | null = goal; cur !== null; cur = prev.get(cur) ?? null) path.push(cur);
  return path.reverse();
}

describe('2019 Day 6 Part 2 solver', () => {
  it('solves the official example (4 transfers) and exposes frozen policy metadata', () => {
    expect(Object.isFrozen(solver)).toBe(true);
    expect(solver.policy).toBe(SANTA_TRANSFER_POLICY);
    const execution = executeSolver(solver, EXAMPLE_INPUT);
    expect(execution.answer).toBe(4);
    expect(execution.elapsedMs).toBeGreaterThanOrEqual(0);
  });

  it('traces example transfers across omitted, empty, and capped maxSteps options', () => {
    const map = solver.parse(EXAMPLE_INPUT);
    const omitted = solver.trace(map);
    expect(omitted).toHaveLength(5);
    expect(solver.trace(map, {})).toHaveLength(5);
    const last = asTransfer(omitted[4]!);
    expect(last.stepIndex).toBe(4);
    expect(map.labelOf(last.lcaNodeId)).toBe('D');
    expect(last.traversedNodeIds.map((id) => map.labelOf(id))).toEqual(['K', 'J', 'E', 'D', 'I']);

    const one = solver.trace(map, { maxSteps: 1 });
    expect(one).toHaveLength(1);
    const oneFrame = asTransfer(one[0]!);
    expect(oneFrame.stepIndex).toBe(4);
    expect(oneFrame.traversedNodeIds.map((id) => map.labelOf(id))).toEqual(['K', 'J', 'E', 'D', 'I']);
    expect(solver.trace(map, { maxSteps: 3 }).map((f) => asTransfer(f).stepIndex)).toEqual([0, 2, 4]);
  });

  it('caps deep chain traces at DEFAULT_MAX_TRACE_STEPS (80)', () => {
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(80);
    const deep = solver.parse(buildDeepChain(100));
    expect(solver.solve(deep)).toBe(100);
    expect(solver.trace(deep)).toHaveLength(DEFAULT_MAX_TRACE_STEPS);
  });

  it('handles same-parent, ancestor/descendant, and COM-LCA boundary topologies', () => {
    for (const raw of ['COM)YOU\nCOM)SAN', 'COM)A\nA)YOU\nA)SAN']) {
      const map = solver.parse(raw);
      expect(solver.solve(map)).toBe(0);
      const frames = solver.trace(map);
      expect(frames).toHaveLength(1);
      const frame = asTransfer(frames[0]!);
      expect(frame.lcaNodeId).toBe(frame.fromNodeId);
      expect(frame.fromNodeId).toBe(frame.toNodeId);
    }
    expect(executeSolver(solver, 'COM)A\nA)SAN\nA)B\nB)YOU').answer).toBe(1);
    expect(executeSolver(solver, 'COM)A\nA)YOU\nA)B\nB)SAN').answer).toBe(1);
    const comLca = solver.parse('COM)A\nA)YOU\nCOM)B\nB)SAN');
    expect(solver.solve(comLca)).toBe(2);
    expect(comLca.labelOf(asTransfer(solver.trace(comLca)[0]!).lcaNodeId)).toBe('COM');
  });

  it('propagates missing endpoints, syntax, topology, and maxSteps errors', () => {
    expect(() => executeSolver(solver, 'COM)SAN')).toThrow(RangeError);
    expect(() => executeSolver(solver, 'COM)YOU')).toThrow(RangeError);
    expect(() => executeSolver(solver, 'BAD_LINE')).toThrow(SyntaxError);
    expect(() => executeSolver(solver, 'COM)YOU\nA)B\nB)SAN')).toThrow(RangeError);
    expect(() => solver.trace(solver.parse('COM)YOU\nCOM)SAN'), { maxSteps: 0 })).toThrow(RangeError);
  });

  it('matches an independent undirected BFS oracle across 30 seeded random trees', () => {
    let seed = 20_190_602;
    for (let trial = 0; trial < 30; trial += 1) {
      const tree = generateRandomTree(seed);
      seed = tree.nextSeed;
      const expectedPath = bfsOraclePath(tree.edges);
      const map = solver.parse(tree.raw);
      expect(solver.solve(map)).toBe(expectedPath.length - 1);
      const frames = solver.trace(map);
      const last = asTransfer(frames[frames.length - 1]!);
      expect(last.traversedNodeIds.map((id) => map.labelOf(id))).toEqual(expectedPath);
    }
  });
});
