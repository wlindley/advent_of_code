import { describe, expect, it } from 'vitest';
import { DirectedGraph } from '../../../shared/core';
import { AdapterChain, MAX_JOLT_STEP } from './chain';
import { ArrangementStep, ArrangementTable, computeArrangementTable } from './arrangements';

function buildReferenceGraph(chain: AdapterChain): DirectedGraph<number> {
  const adj: Array<readonly [number, number[]]> = [];
  for (let i = 0; i < chain.nodeCount; i += 1) {
    const u = chain.joltageAt(i);
    const out: number[] = [];
    for (let j = i + 1; j < chain.nodeCount; j += 1) {
      const v = chain.joltageAt(j);
      if (v - u <= MAX_JOLT_STEP) out.push(v);
    }
    adj.push([u, out]);
  }
  return new DirectedGraph<number>(adj);
}

function generatePrngChain(seedInput: number): AdapterChain {
  let state = seedInput >>> 0;
  const ratings: number[] = [];
  let current = 0;
  const length = 8 + (seedInput % 12);
  for (let i = 0; i < length; i += 1) {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    const step = 1 + (state % 3);
    current += step;
    ratings.push(current);
  }
  return new AdapterChain(ratings);
}

describe('ArrangementStep & ArrangementTable', () => {
  it('validates step and table invariants and derives properties', () => {
    const s0 = new ArrangementStep(0, [], 1n);
    const s1 = new ArrangementStep(1, [0], 1n);
    const s2 = new ArrangementStep(2, [0, 1], 2n);
    expect(s0.branchCount).toBe(0);
    expect(s0.isBranching).toBe(false);
    expect(s0.waysLog2).toBe(0);
    expect(s2.branchCount).toBe(2);
    expect(s2.isBranching).toBe(true);
    expect(s2.waysLog2).toBe(1);
    expect(Object.isFrozen(s2)).toBe(true);

    const table = new ArrangementTable([s0, s1, s2]);
    expect(table.nodeCount).toBe(3);
    expect(table.steps).toHaveLength(3);
    expect(table.totalArrangements).toBe(2n);
    expect(table.maxWaysLog2).toBe(1);
    expect(table.stepAt(1)).toBe(s1);
    expect(table.waysAt(2)).toBe(2n);
    expect(Object.isFrozen(table)).toBe(true);

    expect(() => new ArrangementStep(-1, [], 1n)).toThrow(RangeError);
    expect(() => new ArrangementStep(0, [], 0n)).toThrow(RangeError);
    expect(() => new ArrangementTable([])).toThrow(RangeError);
    expect(() => table.stepAt(-1)).toThrow(RangeError);
    expect(() => table.waysAt(3)).toThrow(RangeError);
  });
});

describe('computeArrangementTable', () => {
  it('matches both official examples and small branching/2-jolt cases', () => {
    const small = new AdapterChain([16, 10, 15, 5, 1, 11, 7, 19, 6, 12, 4]);
    expect(computeArrangementTable(small).totalArrangements).toBe(8n);

    const large = new AdapterChain([
      28, 33, 18, 42, 31, 14, 46, 20, 48, 47, 24, 23, 49, 45, 19, 38,
      39, 11, 1, 32, 25, 35, 8, 17, 7, 9, 4, 2, 34, 10, 3,
    ]);
    expect(computeArrangementTable(large).totalArrangements).toBe(19208n);

    expect(computeArrangementTable(new AdapterChain([2, 4, 6])).totalArrangements).toBe(1n);
    expect(computeArrangementTable(new AdapterChain([1, 3, 5])).totalArrangements).toBe(2n);
    expect(computeArrangementTable(new AdapterChain([1, 3, 4])).totalArrangements).toBe(3n);
    expect(computeArrangementTable(new AdapterChain([1, 2, 3, 4])).totalArrangements).toBe(7n);
  });

  it('computes exact BigInt Tribonacci counts past Number.MAX_SAFE_INTEGER and 2^70', () => {
    const chain80 = new AdapterChain(Array.from({ length: 80 }, (_, i) => i + 1));
    const table80 = computeArrangementTable(chain80);
    expect(table80.totalArrangements).toBe(918838005896863447985n);
    expect(table80.totalArrangements).toBeGreaterThan(BigInt(Number.MAX_SAFE_INTEGER));
    expect(table80.maxWaysLog2).toBeGreaterThan(69);
    expect(table80.totalArrangements).toBe(buildReferenceGraph(chain80).countPaths(0, chain80.deviceJoltage));

    const chain81 = new AdapterChain(Array.from({ length: 81 }, (_, i) => i + 1));
    const table81 = computeArrangementTable(chain81);
    expect(table81.totalArrangements).toBeGreaterThan(1n << 70n);
    expect(table81.maxWaysLog2).toBeGreaterThan(70);
  });

  it('matches DirectedGraph.countPaths across 30 seeded PRNG chains', () => {
    for (let seed = 1; seed <= 30; seed += 1) {
      const chain = generatePrngChain(seed);
      const table = computeArrangementTable(chain);
      const expected = buildReferenceGraph(chain).countPaths(0, chain.deviceJoltage);
      expect(table.totalArrangements).toBe(expected);
    }
  });
});
