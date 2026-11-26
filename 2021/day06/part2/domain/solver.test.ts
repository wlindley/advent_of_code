import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import {
  LanternfishSchool,
  PART2_DAYS,
  TIMER_BUCKETS,
  type CohortTuple,
  type TimerBucket,
} from '../../shared';
import { solver } from './index';

function buildLineageOracle(maxDays: number): readonly bigint[] {
  const table: bigint[] = new Array<bigint>(maxDays + 1).fill(1n);
  for (let d = 1; d <= maxDays; d += 1) {
    const parentBranch = d - 7 <= 0 ? 1n : table[d - 7]!;
    const childBranch = d - 9 <= 0 ? 1n : table[d - 9]!;
    table[d] = parentBranch + childBranch;
  }
  return table;
}

function oracleTotalForCounts(
  counts: CohortTuple,
  oracle: readonly bigint[],
  days: number,
): bigint {
  let total = 0n;
  for (const timer of TIMER_BUCKETS) {
    total += counts[timer] * oracle[days - timer]!;
  }
  return total;
}

function nextPrng(state: number): number {
  return (Math.imul(state, 1664525) + 1013904223) >>> 0;
}

function generatePrngSchool(seed: number, length: number): { timers: TimerBucket[]; seed: number } {
  let current = seed;
  const timers: TimerBucket[] = [];
  for (let i = 0; i < length; i += 1) {
    current = nextPrng(current);
    timers.push((current % 9) as TimerBucket);
  }
  return { timers, seed: current };
}

const LINEAGE_ORACLE = buildLineageOracle(PART2_DAYS);

const OVERFLOW_FIXTURES: readonly CohortTuple[] = [
  [9_007_199_254_740_993n, 0n, 1n, 0n, 0n, 0n, 0n, 0n, 0n],
  [0n, 9_223_372_036_854_775_809n, 3n, 5n, 7n, 11n, 13n, 17n, 19n],
  [1n, 2n, 3n, 4n, 18_446_744_073_709_551_617n, 5n, 6n, 7n, 8n],
  [
    1_000_000_000_000_001n,
    2_000_000_000_000_003n,
    3_000_000_000_000_005n,
    4_000_000_000_000_007n,
    5_000_000_000_000_009n,
    6_000_000_000_000_011n,
    7_000_000_000_000_013n,
    8_000_000_000_000_015n,
    9_000_000_000_000_017n,
  ],
  [0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 12_345_678_901_234_567_891n],
];

describe('2021 day 6 part 2 solver', () => {
  it('solves the official 256-day example to 26984457539n', () => {
    expect(solver.days).toBe(256);
    const execution = executeSolver(solver, '3,4,3,1,2');
    expect(execution.answer).toBe(26984457539n);
  });

  it('produces 257 default trace frames and respects maxSteps 17 and 1', () => {
    const school = solver.parse('3,4,3,1,2');
    const full = solver.trace(school);
    expect(full).toHaveLength(257);
    expect(full[0]?.day).toBe(0);
    expect(full[0]?.totalPopulation).toBe(5n);
    expect(full[0]?.spawnedToday).toBe(0n);
    expect(full[18]?.totalPopulation).toBe(26n);
    expect(full[80]?.totalPopulation).toBe(5934n);
    expect(full[256]?.day).toBe(256);
    expect(full[256]?.totalPopulation).toBe(26984457539n);

    const sampled = solver.trace(school, { maxSteps: 17 });
    expect(sampled).toHaveLength(17);
    expect(sampled[0]?.day).toBe(0);
    expect(sampled[16]?.day).toBe(256);

    const single = solver.trace(school, { maxSteps: 1 });
    expect(single).toHaveLength(1);
    expect(single[0]?.day).toBe(256);
    expect(single[0]?.totalPopulation).toBe(26984457539n);
  });

  it('propagates parse and trace validation errors', () => {
    expect(() => executeSolver(solver, '')).toThrow(RangeError);
    expect(() => executeSolver(solver, '3,9,1')).toThrow(RangeError);
    expect(() => executeSolver(solver, '3,-1,2')).toThrow(SyntaxError);
    expect(() => executeSolver(solver, '3,bad')).toThrow(SyntaxError);
    const school = solver.parse('3,4,3,1,2');
    expect(() => solver.trace(school, { maxSteps: 0 })).toThrow(RangeError);
  });

  it('matches the 1D lineage DP oracle for all 9 basis timers 0..8', () => {
    for (const timer of TIMER_BUCKETS) {
      const school = solver.parse(String(timer));
      expect(solver.solve(school)).toBe(LINEAGE_ORACLE[PART2_DAYS - timer]);
    }
  });

  it('matches the 1D lineage DP oracle across 30 seeded PRNG schools', () => {
    let seed = 0x20210602;
    for (let idx = 0; idx < 30; idx += 1) {
      const length = (idx * 2) % 60 + 1;
      const generated = generatePrngSchool(seed, length);
      seed = generated.seed;
      const school = solver.parse(generated.timers.join(','));
      const expected = oracleTotalForCounts(school.counts, LINEAGE_ORACLE, PART2_DAYS);
      expect(solver.solve(school)).toBe(expected);
    }
  });

  it('preserves exact BigInt precision on overflow-regime cohort counts', () => {
    for (const counts of OVERFLOW_FIXTURES) {
      const school = new LanternfishSchool(counts);
      const expected = oracleTotalForCounts(counts, LINEAGE_ORACLE, PART2_DAYS);
      expect(solver.solve(school)).toBe(expected);
    }
  });
});
