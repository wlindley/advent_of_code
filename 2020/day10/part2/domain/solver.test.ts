import { describe, expect, it } from 'vitest';
import { DirectedGraph } from '../../../../shared/core';
import type { AdapterChain, AdapterTraceFrame, ArrangementTraceFrame } from '../../shared';
import { solver } from './index';

const SMALL_EXAMPLE = [16, 10, 15, 5, 1, 11, 7, 19, 6, 12, 4].join('\n');

const LARGER_EXAMPLE = [
  28, 33, 18, 42, 31, 14, 46, 20, 48, 47, 24, 23, 49, 45, 19, 38,
  39, 11, 1, 32, 25, 35, 8, 17, 7, 9, 4, 2, 34, 10, 3,
].join('\n');

function nextState(state: number): number {
  return (Math.imul(state, 1664525) + 1013904223) >>> 0;
}

function buildShuffledInput(initialState: number, length: number): { raw: string; next: number } {
  let state = initialState;
  let joltage = 0;
  const values: number[] = [];
  for (let i = 0; i < length; i += 1) {
    state = nextState(state);
    joltage += ((state >>> 16) % 3) + 1;
    values.push(joltage);
  }
  for (let i = values.length - 1; i > 0; i -= 1) {
    state = nextState(state);
    const j = (state >>> 16) % (i + 1);
    [values[i], values[j]] = [values[j]!, values[i]!];
  }
  return { raw: values.join('\n'), next: state };
}

function memoDfs(nodes: readonly number[], index: number, memo: Map<number, bigint>): bigint {
  if (index === nodes.length - 1) return 1n;
  const cached = memo.get(index);
  if (cached !== undefined) return cached;
  let sum = 0n;
  const current = nodes[index]!;
  for (let next = index + 1; next < nodes.length && nodes[next]! - current <= 3; next += 1) {
    sum += memoDfs(nodes, next, memo);
  }
  memo.set(index, sum);
  return sum;
}

function graphCountPaths(chain: AdapterChain): bigint {
  const nodes = chain.ratings;
  const adj: Array<[number, number[]]> = [];
  for (let i = 0; i < nodes.length; i += 1) {
    const u = nodes[i]!;
    const out: number[] = [];
    for (let j = i + 1; j < nodes.length && nodes[j]! - u <= 3; j += 1) out.push(nodes[j]!);
    adj.push([u, out]);
  }
  return new DirectedGraph<number>(adj).countPaths(0, chain.deviceJoltage);
}

function expectArrangement(frame: AdapterTraceFrame | undefined): ArrangementTraceFrame {
  expect(frame?.phase).toBe('arrangements');
  return frame as ArrangementTraceFrame;
}

describe('2020 Day 10 Part 2 solver', () => {
  it('counts distinct arrangements for both official examples', () => {
    expect(solver.solve(solver.parse(SMALL_EXAMPLE))).toBe(8n);
    expect(solver.solve(solver.parse(LARGER_EXAMPLE))).toBe(19208n);
  });

  it('produces full and bounded arrangement trace progression', () => {
    const small = solver.parse(SMALL_EXAMPLE);
    const full = solver.trace(small);
    expect(full).toHaveLength(13);
    const first = expectArrangement(full[0]);
    expect(first.activeIndex).toBe(0);
    expect(first.step).toBe(1);
    expect(first.ways).toBe(1n);
    expect(first.predecessorIndices).toEqual([]);
    expect(first.isComplete).toBe(false);
    const branch = expectArrangement(full[5]);
    expect(small.joltageAt(branch.activeIndex)).toBe(7);
    expect(branch.predecessorIndices).toEqual([2, 3, 4]);
    expect(branch.ways).toBe(4n);
    expect(branch.waysIfComputed(5)).toBe(4n);
    expect(branch.waysIfComputed(6)).toBeNull();
    const last = expectArrangement(full[12]);
    expect(last.ways).toBe(8n);
    expect(last.isComplete).toBe(true);
    expect(first.table).toBe(last.table);
    expect(Object.isFrozen(first.table)).toBe(true);
    const larger = solver.parse(LARGER_EXAMPLE);
    const capped = solver.trace(larger, { maxSteps: 5 });
    expect(capped).toHaveLength(5);
    expect(expectArrangement(capped[0]).activeIndex).toBe(0);
    expect(expectArrangement(capped[4]).activeIndex).toBe(32);
    expect(expectArrangement(capped[4]).ways).toBe(19208n);
    const single = solver.trace(larger, { maxSteps: 1 });
    expect(single).toHaveLength(1);
    expect(expectArrangement(single[0]).activeIndex).toBe(32);
    expect(expectArrangement(single[0]).isComplete).toBe(true);
    expect(expectArrangement(single[0]).ways).toBe(19208n);
  });

  it('handles boundary chains and unsorted CRLF input', () => {
    expect(solver.solve(solver.parse('1'))).toBe(1n);
    expect(solver.solve(solver.parse('2'))).toBe(1n);
    expect(solver.solve(solver.parse('3'))).toBe(1n);
    expect(solver.solve(solver.parse('3\n6\n9\n12'))).toBe(1n);
    expect(solver.solve(solver.parse('2\n4\n6'))).toBe(1n);
    expect(solver.solve(solver.parse('1\n3\n5'))).toBe(2n);
    expect(solver.solve(solver.parse('1\n3\n4'))).toBe(3n);
    expect(solver.solve(solver.parse('1\n2\n3\n4'))).toBe(7n);
    expect(solver.solve(solver.parse('3\r\n\r\n1\n2\n'))).toBe(4n);
  });

  it('computes exact BigInt Tribonacci values exceeding 2^70', () => {
    const consecutive = Array.from({ length: 81 }, (_, i) => String(i + 1)).join('\n');
    const chain = solver.parse(consecutive);
    const answer = solver.solve(chain);
    expect(answer > (1n << 70n)).toBe(true);
    expect(answer).toBe(memoDfs(chain.ratings, 0, new Map()));
    expect(answer).toBe(graphCountPaths(chain));
  });

  it('rejects invalid input chains and invalid maxSteps options', () => {
    expect(() => solver.parse('')).toThrow(RangeError);
    expect(() => solver.parse(' \n ')).toThrow(RangeError);
    expect(() => solver.parse('4')).toThrow(RangeError);
    expect(() => solver.parse('1\n5')).toThrow(RangeError);
    expect(() => solver.parse('1\n1')).toThrow(/Duplicate/);
    expect(() => solver.parse('0')).toThrow(RangeError);
    expect(() => solver.parse('-1')).toThrow(RangeError);
    expect(() => solver.parse('1\nbad')).toThrow(SyntaxError);

    const chain = solver.parse('1');
    expect(() => solver.trace(chain, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => solver.trace(chain, { maxSteps: -1 })).toThrow(RangeError);
    expect(() => solver.trace(chain, { maxSteps: 1.5 })).toThrow(RangeError);
  });

  it('matches independent DFS and DirectedGraph oracles across 35 shuffled chains', () => {
    let state = 0x20201002;
    for (let i = 0; i < 35; i += 1) {
      const { raw, next } = buildShuffledInput(state, 3 + i);
      state = next;
      const chain = solver.parse(raw);
      const actual = solver.solve(chain);
      expect(actual).toBe(memoDfs(chain.ratings, 0, new Map()));
      expect(actual).toBe(graphCountPaths(chain));
    }
  });
});
