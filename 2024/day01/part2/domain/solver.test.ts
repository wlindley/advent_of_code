import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { LocationLists } from '../../shared';
import {
  DEFAULT_MAX_TRACE_STEPS,
  LocationMatch,
  buildRightFrequencies,
  computeSimilarityScore,
  solver,
  traceSimilarityScore,
} from './index';

const EXAMPLE_INPUT = ['3   4', '4   3', '2   5', '1   3', '3   9', '3   3'].join('\n');

class SeededRng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  nextFloat(): number {
    this.state = (Math.imul(this.state, 1664525) + 1013904223) >>> 0;
    return this.state / 0x100000000;
  }
}

function advanceEqualRun(sorted: Float64Array, start: number, target: number): number {
  let end = start;
  while (end < sorted.length && sorted[end]! === target) end += 1;
  return end;
}

/** Independent sorted two-pointer run-merging oracle in BigInt. */
function sortedTwoPointerOracle(lists: LocationLists): bigint {
  const left = Float64Array.from(lists.left).sort();
  const right = Float64Array.from(lists.right).sort();
  let total = 0n;
  let i = 0;
  let j = 0;
  while (i < left.length && j < right.length) {
    const lv = left[i]!;
    const rv = right[j]!;
    if (lv < rv) {
      i += 1;
    } else if (lv > rv) {
      j += 1;
    } else {
      const iEnd = advanceEqualRun(left, i, lv);
      const jEnd = advanceEqualRun(right, j, rv);
      total += BigInt(lv) * BigInt(iEnd - i) * BigInt(jEnd - j);
      i = iEnd;
      j = jEnd;
    }
  }
  return total;
}

describe('LocationMatch', () => {
  it('normalizes -0, freezes, and computes BigInt contribution without overflow', () => {
    const match = new LocationMatch(-0, -0, -0);
    expect(Object.is(match.index, 0)).toBe(true);
    expect(Object.is(match.locationId, 0)).toBe(true);
    expect(Object.is(match.rightCount, 0)).toBe(true);
    expect(match.contribution).toBe(0n);
    expect(Object.isFrozen(match)).toBe(true);

    const large = new LocationMatch(2, Number.MAX_SAFE_INTEGER, 3);
    expect(large.contribution).toBe(BigInt(Number.MAX_SAFE_INTEGER) * 3n);
  });

  it('rejects invalid index, locationId, and rightCount individually', () => {
    expect(() => new LocationMatch(-1, 5, 1)).toThrow(RangeError);
    expect(() => new LocationMatch(1.5, 5, 1)).toThrow(RangeError);
    expect(() => new LocationMatch(0, Number.MAX_SAFE_INTEGER + 1, 1)).toThrow(RangeError);
    expect(() => new LocationMatch(0, Number.NaN, 1)).toThrow(RangeError);
    expect(() => new LocationMatch(0, 5, -1)).toThrow(RangeError);
    expect(() => new LocationMatch(0, 5, 2.25)).toThrow(RangeError);
  });
});

describe('buildRightFrequencies', () => {
  it('counts empty, duplicate, and negative right-column location IDs', () => {
    expect(buildRightFrequencies(new LocationLists([], [])).size).toBe(0);
    const counts = buildRightFrequencies(new LocationLists([1, 2, 3, 4], [-5, 3, -5, 3]));
    expect(counts.get(-5)).toBe(2);
    expect(counts.get(3)).toBe(2);
    expect(counts.get(1)).toBeUndefined();
  });
});

describe('2024 Day 1 Part 2 solver', () => {
  it('solves the official example to 31n via computeSimilarityScore and executeSolver', () => {
    const lists = solver.parse(EXAMPLE_INPUT);
    expect(computeSimilarityScore(lists)).toBe(31n);

    const execution = executeSolver(solver, EXAMPLE_INPUT, { nowMs: () => 42 });
    expect(execution.answer).toBe(31n);
    expect(execution.elapsedMs).toBe(0);
    expect(execution.runtime).toBe('main-thread');
  });

  it('handles empty, single match/miss, disjoint, duplicates, negatives, BigInt overflow, and invalid raw input', () => {
    expect(computeSimilarityScore(new LocationLists([], []))).toBe(0n);
    expect(computeSimilarityScore(new LocationLists([7], [7]))).toBe(7n);
    expect(computeSimilarityScore(new LocationLists([7], [8]))).toBe(0n);
    expect(computeSimilarityScore(new LocationLists([1, 2], [3, 4]))).toBe(0n);
    expect(computeSimilarityScore(new LocationLists([-4, -4, 5], [-4, -4, -4]))).toBe(-24n);

    const big = Number.MAX_SAFE_INTEGER;
    expect(computeSimilarityScore(new LocationLists([big, big], [big, big]))).toBe(BigInt(big) * 4n);

    expect(() => solver.parse('')).toThrow(Error);
    expect(() => solver.parse('3 abc')).toThrow(Error);
  });

  it('traces empty, official example, maxSteps=1, large sampled inputs, and rejects invalid maxSteps', () => {
    const emptyFrames = traceSimilarityScore(new LocationLists([], []));
    expect(emptyFrames).toHaveLength(1);
    expect(emptyFrames[0]).toEqual({
      scannedCount: 0,
      totalItems: 0,
      activeMatch: null,
      cumulativeScore: 0n,
    });

    const lists = solver.parse(EXAMPLE_INPUT);
    const full = traceSimilarityScore(lists);
    expect(full).toHaveLength(7);
    expect(full[0]!.activeMatch).toBeNull();
    expect(full[1]!.activeMatch).toEqual(new LocationMatch(0, 3, 3));
    expect(full[3]!.activeMatch).toEqual(new LocationMatch(2, 2, 0));
    expect(full[6]!.scannedCount).toBe(6);
    expect(full[6]!.cumulativeScore).toBe(31n);
    expect(Object.isFrozen(full)).toBe(true);
    expect(Object.isFrozen(full[1])).toBe(true);

    const single = traceSimilarityScore(lists, { maxSteps: 1 });
    expect(single).toHaveLength(1);
    expect(single[0]!.scannedCount).toBe(6);
    expect(single[0]!.cumulativeScore).toBe(31n);

    const largeLeft = Array.from({ length: 250 }, (_, i) => i % 50);
    const largeRight = Array.from({ length: 250 }, (_, i) => (i * 3) % 50);
    const largeLists = new LocationLists(largeLeft, largeRight);
    const sampled = traceSimilarityScore(largeLists);
    expect(sampled).toHaveLength(DEFAULT_MAX_TRACE_STEPS);
    expect(sampled[0]!.scannedCount).toBe(0);
    expect(sampled[sampled.length - 1]!.scannedCount).toBe(250);
    expect(sampled[sampled.length - 1]!.cumulativeScore).toBe(computeSimilarityScore(largeLists));

    for (const invalid of [0, -1, 1.5, Number.NaN]) {
      expect(() => traceSimilarityScore(lists, { maxSteps: invalid })).toThrow(RangeError);
    }
  });

  it('matches sortedTwoPointerOracle across seeded random inputs up to N=1000', () => {
    const rng = new SeededRng(20241201);
    for (const size of [1, 2, 7, 35, 128, 512, 1000]) {
      const left = Array.from({ length: size }, () => Math.floor(rng.nextFloat() * 120) - 60);
      const right = Array.from({ length: size }, () => Math.floor(rng.nextFloat() * 120) - 60);
      const lists = new LocationLists(left, right);
      expect(computeSimilarityScore(lists)).toBe(sortedTwoPointerOracle(lists));
    }
  });
});
