import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { BagRuleGraph, DEFAULT_TARGET_COLOR, HaversackSolver, NESTED_BAG_COUNT_POLICY } from '../../shared';
import { solver } from './index';

const EXAMPLE_1 = [
  'light red bags contain 1 bright white bag, 2 muted yellow bags.',
  'dark orange bags contain 3 bright white bags, 4 muted yellow bags.',
  'bright white bags contain 1 shiny gold bag.',
  'muted yellow bags contain 2 shiny gold bags, 9 faded blue bags.',
  'shiny gold bags contain 1 dark olive bag, 2 vibrant plum bags.',
  'dark olive bags contain 3 faded blue bags, 4 dotted black bags.',
  'vibrant plum bags contain 5 faded blue bags, 6 dotted black bags.',
  'faded blue bags contain no other bags.',
  'dotted black bags contain no other bags.',
].join('\n');

function alphaColor(index: number): string {
  let n = index;
  let s = '';
  for (let i = 0; i < 3; i += 1) {
    s = String.fromCharCode(97 + (n % 26)) + s;
    n = Math.floor(n / 26);
  }
  return s;
}

function formatClause(qty: bigint, color: string): string {
  return `${qty} ${color} ${qty === 1n ? 'bag' : 'bags'}`;
}

function buildDoublingChain(colors: readonly string[]): string {
  const lines: string[] = [];
  for (let i = 0; i < colors.length; i += 1) {
    const tail = i + 1 < colors.length ? formatClause(2n, colors[i + 1]!) : 'no other bags';
    lines.push(`${colors[i]} bags contain ${tail}.`);
  }
  return lines.join('\n');
}

const EXAMPLE_2 = buildDoublingChain(
  ['shiny gold', 'dark red', 'dark orange', 'dark yellow', 'dark green', 'dark blue', 'dark violet'],
);

function oracleNestedCount(graph: BagRuleGraph, color: string, memo: Map<string, bigint>): bigint {
  const cached = memo.get(color);
  if (cached !== undefined) return cached;
  let total = 0n;
  for (const item of graph.ruleFor(color).contents) {
    total += item.quantity * (1n + oracleNestedCount(graph, item.color, memo));
  }
  memo.set(color, total);
  return total;
}

function nextRand(state: { seed: number }): number {
  state.seed = (state.seed * 1664525 + 1013904223) >>> 0;
  return state.seed;
}

function buildRandomDagInput(seed: number): string {
  const rng = { seed };
  const count = 5 + (nextRand(rng) % 10);
  const colors = ['shiny gold'];
  for (let i = 0; i < count - 1; i += 1) colors.push(alphaColor(i));
  const lines: string[] = [];
  for (let i = 0; i < colors.length; i += 1) {
    const clauses: string[] = [];
    for (let j = i + 1; j < colors.length; j += 1) {
      if (nextRand(rng) % 3 === 0) clauses.push(formatClause(BigInt(1 + (nextRand(rng) % 5)), colors[j]!));
    }
    lines.push(`${colors[i]} bags contain ${clauses.length > 0 ? clauses.join(', ') : 'no other bags'}.`);
  }
  return lines.join('\n');
}

describe('2020 Day 7 Part 2 solver', () => {
  it('solves official examples and exposes Part 2 policy metadata', () => {
    expect(solver.policy).toBe(NESTED_BAG_COUNT_POLICY);
    expect(solver.targetColor).toBe(DEFAULT_TARGET_COLOR);
    expect(executeSolver(solver, EXAMPLE_1).answer).toBe(32n);
    expect(executeSolver(solver, EXAMPLE_2).answer).toBe(126n);
  });

  it('produces progressive trace frames for Example 1 and Example 2', () => {
    const f1 = solver.trace(solver.parse(EXAMPLE_1));
    expect([f1[0]!.runningTotal, f1[1]!.runningTotal, f1[2]!.runningTotal]).toEqual([0n, 3n, 32n]);
    const g2 = solver.parse(EXAMPLE_2);
    const full2 = solver.trace(g2, {});
    expect(full2.length).toBe(7);
    expect(full2[6]!.runningTotal).toBe(126n);
    const sampled = solver.trace(g2, { maxSteps: 3 });
    expect([sampled[0]!.revealedDepth, sampled[1]!.revealedDepth, sampled[2]!.revealedDepth]).toEqual([0, 3, 6]);
    expect(sampled[2]!.runningTotal).toBe(126n);
    const single = solver.trace(g2, { maxSteps: 1 });
    expect(single.length).toBe(1);
    expect(single[0]!.revealedDepth).toBe(6);
    expect(single[0]!.runningTotal).toBe(126n);
  });

  it('handles leaf, missing target, diamond skip-layer, and 66-node BigInt chain', () => {
    const leaf = solver.parse('shiny gold bags contain no other bags.');
    expect(solver.solve(leaf)).toBe(0n);
    expect(solver.trace(leaf)[0]!.targetPresent).toBe(true);
    const missing = solver.parse('faded blue bags contain no other bags.');
    expect(solver.solve(missing)).toBe(0n);
    expect(solver.trace(missing)[0]!.targetPresent).toBe(false);
    const diamond = 'shiny gold bags contain 2 alpha bags, 2 beta bags.\nalpha bags contain 1 beta bag.\nbeta bags contain no other bags.';
    expect(solver.solve(solver.parse(diamond))).toBe(6n);
    const chainColors = ['shiny gold'];
    for (let i = 0; i < 65; i += 1) chainColors.push(alphaColor(i));
    expect(solver.solve(solver.parse(buildDoublingChain(chainColors)))).toBe((1n << 66n) - 2n);
  });

  it('ignores unreachable cycles, rejects reachable cycles, and propagates errors', () => {
    const unreachable = solver.parse('shiny gold bags contain 1 faded blue bag.\nfaded blue bags contain no other bags.\nalpha bags contain 1 beta bag.\nbeta bags contain 1 alpha bag.');
    expect(solver.solve(unreachable)).toBe(1n);

    const reachable = solver.parse('shiny gold bags contain 1 alpha bag.\nalpha bags contain 1 shiny gold bag.');
    expect(() => solver.solve(reachable)).toThrow(Error);
    expect(() => solver.trace(reachable)).toThrow(Error);
    expect(() => solver.parse('')).toThrow(RangeError);
    expect(() => solver.parse('not a valid rule')).toThrow(SyntaxError);
    expect(() => solver.trace(solver.parse(EXAMPLE_1), { maxSteps: 0 })).toThrow(RangeError);
    expect(() => new HaversackSolver(NESTED_BAG_COUNT_POLICY, 'BAD')).toThrow(RangeError);
  });

  it('matches independent memoized BigInt oracle across 35 random weighted DAGs', () => {
    for (let seed = 1; seed <= 35; seed += 1) {
      const graph = solver.parse(buildRandomDagInput(seed));
      expect(solver.solve(graph)).toBe(oracleNestedCount(graph, DEFAULT_TARGET_COLOR, new Map()));
    }
  });
});
