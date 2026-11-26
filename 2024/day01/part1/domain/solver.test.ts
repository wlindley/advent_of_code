import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { LocationLists } from '../../shared';
import {
  DEFAULT_MAX_TRACE_STEPS,
  RankedPair,
  computeTotalDistance,
  sortLocationColumns,
  solver,
  traceTotalDistance,
} from './index';

const EXAMPLE_INPUT = ['3   4', '4   3', '2   5', '1   3', '3   9', '3   3'].join('\n');

function createSeededRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

/** Independent 1D Wasserstein-1 CDF sweep oracle (integrates |C_L(x) - C_R(x)| dx). */
function wassersteinDistanceOracle(lists: LocationLists): number {
  const leftCounts = new Map<number, number>();
  const rightCounts = new Map<number, number>();
  const coords = new Set<number>();
  for (let i = 0; i < lists.size; i += 1) {
    const l = lists.left[i]!;
    const r = lists.right[i]!;
    leftCounts.set(l, (leftCounts.get(l) ?? 0) + 1);
    rightCounts.set(r, (rightCounts.get(r) ?? 0) + 1);
    coords.add(l);
    coords.add(r);
  }
  const sortedCoords = [...coords].sort((a, b) => a - b);
  let total = 0;
  let cumLeft = 0;
  let cumRight = 0;
  for (let i = 0; i + 1 < sortedCoords.length; i += 1) {
    const x = sortedCoords[i]!;
    cumLeft += leftCounts.get(x) ?? 0;
    cumRight += rightCounts.get(x) ?? 0;
    total += Math.abs(cumLeft - cumRight) * (sortedCoords[i + 1]! - x);
  }
  return total;
}

describe('RankedPair', () => {
  it('normalizes -0, freezes, and exposes distance getter', () => {
    const pair = new RankedPair(-0, -5, -0);
    expect(pair.rank).toBe(0);
    expect(pair.left).toBe(-5);
    expect(pair.right).toBe(0);
    expect(pair.distance).toBe(5);
    expect(Object.is(pair.rank, 0)).toBe(true);
    expect(Object.is(pair.right, 0)).toBe(true);
    expect(Object.isFrozen(pair)).toBe(true);
  });

  it('validates rank, left, and right bounds', () => {
    expect(() => new RankedPair(-1, 0, 0)).toThrow(RangeError);
    expect(() => new RankedPair(1.5, 0, 0)).toThrow(RangeError);
    expect(() => new RankedPair(0, Number.MAX_SAFE_INTEGER + 1, 0)).toThrow(RangeError);
    expect(() => new RankedPair(0, 0, Number.NaN)).toThrow(RangeError);
  });
});

describe('2024 Day 1 Part 1 solver', () => {
  it('solves the official example to 11 via computeTotalDistance and executeSolver', () => {
    const lists = solver.parse(EXAMPLE_INPUT);
    expect(computeTotalDistance(lists)).toBe(11);

    const execution = executeSolver(solver, EXAMPLE_INPUT, { nowMs: () => 42 });
    expect(execution.answer).toBe(11);
    expect(execution.elapsedMs).toBe(0);
    expect(execution.runtime).toBe('main-thread');
  });

  it('handles empty lists, negatives, duplicates, and numeric (non-lexicographic) order', () => {
    expect(computeTotalDistance(new LocationLists([], []))).toBe(0);
    expect(sortLocationColumns(new LocationLists([], []))).toEqual({ left: [], right: [] });

    const lists = new LocationLists([100, 2, -10, 2], [9, 19, -3, 100]);
    const sorted = sortLocationColumns(lists);
    expect(sorted.left).toEqual([-10, 2, 2, 100]);
    expect(sorted.right).toEqual([-3, 9, 19, 100]);
    expect(Object.isFrozen(sorted)).toBe(true);
    expect(Object.isFrozen(sorted.left)).toBe(true);
    expect(Object.isFrozen(sorted.right)).toBe(true);
    expect(computeTotalDistance(lists)).toBe(7 + 7 + 17 + 0);
  });

  it('throws RangeError when total distance exceeds safe integer precision', () => {
    const lists = new LocationLists(
      [0, 0],
      [Number.MAX_SAFE_INTEGER, 1],
    );
    expect(() => computeTotalDistance(lists)).toThrow(RangeError);
    expect(() => traceTotalDistance(lists)).toThrow(RangeError);
  });

  it('produces exact trace frames for empty, small, maxSteps=1, and sampled large inputs', () => {
    const emptyFrames = traceTotalDistance(new LocationLists([], []));
    expect(emptyFrames).toHaveLength(1);
    expect(emptyFrames[0]).toEqual({
      pairedCount: 0,
      totalPairs: 0,
      activePair: null,
      cumulativeDistance: 0,
    });

    const lists = solver.parse(EXAMPLE_INPUT);
    const fullFrames = traceTotalDistance(lists);
    expect(fullFrames).toHaveLength(7);
    expect(fullFrames[0]!.activePair).toBeNull();
    expect(fullFrames[0]!.cumulativeDistance).toBe(0);
    expect(fullFrames[6]!.pairedCount).toBe(6);
    expect(fullFrames[6]!.cumulativeDistance).toBe(11);
    expect(fullFrames[6]!.activePair).toEqual(new RankedPair(5, 4, 9));
    expect(Object.isFrozen(fullFrames)).toBe(true);
    expect(Object.isFrozen(fullFrames[1])).toBe(true);

    const singleFrame = traceTotalDistance(lists, { maxSteps: 1 });
    expect(singleFrame).toHaveLength(1);
    expect(singleFrame[0]!.pairedCount).toBe(6);
    expect(singleFrame[0]!.cumulativeDistance).toBe(11);

    const largeLeft = Array.from({ length: 250 }, (_, i) => 250 - i);
    const largeRight = Array.from({ length: 250 }, (_, i) => i * 2);
    const largeLists = new LocationLists(largeLeft, largeRight);
    const sampled = traceTotalDistance(largeLists);
    expect(sampled).toHaveLength(DEFAULT_MAX_TRACE_STEPS);
    expect(sampled[0]!.pairedCount).toBe(0);
    expect(sampled[sampled.length - 1]!.pairedCount).toBe(250);
    expect(sampled[sampled.length - 1]!.cumulativeDistance).toBe(computeTotalDistance(largeLists));

    expect(() => traceTotalDistance(lists, { maxSteps: 0 })).toThrow(RangeError);
  });

  it('matches the independent Wasserstein CDF sweep oracle across seeded random inputs up to N=1000', () => {
    const rng = createSeededRng(20241201);
    const sizes = [1, 2, 7, 35, 128, 512, 1000];
    for (const size of sizes) {
      const left = Array.from({ length: size }, () => Math.floor(rng() * 400) - 200);
      const right = Array.from({ length: size }, () => Math.floor(rng() * 400) - 200);
      const lists = new LocationLists(left, right);
      expect(computeTotalDistance(lists)).toBe(wassersteinDistanceOracle(lists));
    }
  });
});
