import { describe, expect, it } from 'vitest';
import { executeSolver, type Clock } from '../../../../shared/core';
import { Report } from '../../shared';
import {
  countDampenedSafeReports,
  DEFAULT_MAX_TRACE_STEPS,
  solver,
  traceDampenedReports,
} from './solver';

const EXAMPLE_INPUT = [
  '7 6 4 2 1',
  '1 2 7 8 9',
  '9 7 6 2 1',
  '1 3 2 4 5',
  '8 6 4 4 1',
  '1 3 6 7 9',
].join('\n');

function isStrictlySafeOracle(levels: readonly number[]): boolean {
  if (levels.length < 2) return true;
  let inc = true;
  let dec = true;
  for (let i = 1; i < levels.length; i += 1) {
    const d = levels[i]! - levels[i - 1]!;
    if (d < 1 || d > 3) inc = false;
    if (d > -1 || d < -3) dec = false;
  }
  return inc || dec;
}

function isDampenedSafeOracle(levels: readonly number[]): boolean {
  if (isStrictlySafeOracle(levels)) return true;
  for (let skip = 0; skip < levels.length; skip += 1) {
    if (isStrictlySafeOracle(levels.filter((_, idx) => idx !== skip))) return true;
  }
  return false;
}

function nextSeededInt(state: { seed: number }, span: number): number {
  state.seed = (Math.imul(state.seed, 1664525) + 1013904223) >>> 0;
  return state.seed % span;
}

function generateSeededReports(count: number, seed: number): readonly Report[] {
  const rng = { seed };
  const reports: Report[] = [];
  for (let i = 0; i < count; i += 1) {
    const len = nextSeededInt(rng, 8);
    const levels: number[] = [];
    let cur = nextSeededInt(rng, 21) - 10;
    for (let j = 0; j < len; j += 1) {
      if (j > 0) cur += nextSeededInt(rng, 11) - 5;
      levels.push(cur);
    }
    reports.push(new Report(levels));
  }
  return reports;
}

function createFakeClock(ticks: readonly number[]): Clock {
  let idx = 0;
  return {
    nowMs: () => {
      const value = ticks[idx] ?? ticks[ticks.length - 1]!;
      idx += 1;
      return value;
    },
  };
}

describe('day02/part2 solver', () => {
  it('solves the official example and executes with a fake clock', () => {
    const parsed = solver.parse(EXAMPLE_INPUT);
    expect(solver.solve(parsed)).toBe(4);
    expect(Object.isFrozen(solver)).toBe(true);

    const exec = executeSolver(solver, EXAMPLE_INPUT, createFakeClock([10, 14.25]));
    expect(exec).toEqual({ answer: 4, elapsedMs: 4.25, runtime: 'main-thread' });
  });

  it('handles an empty report list cleanly in count and trace', () => {
    expect(countDampenedSafeReports([])).toBe(0);
    const frames = traceDampenedReports([]);
    expect(Object.isFrozen(frames)).toBe(true);
    expect(frames).toHaveLength(1);
    expect(frames[0]).toMatchObject({
      scannedCount: 0,
      totalReports: 0,
      activeEvaluation: null,
      nativeSafeCount: 0,
      dampenedSafeCount: 0,
      totalSafeCount: 0,
      unsafeCount: 0,
    });
  });

  it('traces full and sampled runs and computes dynamic frame getters', () => {
    const reports = solver.parse(EXAMPLE_INPUT);
    const full = traceDampenedReports(reports);
    expect(full).toHaveLength(7);
    expect(Object.isFrozen(full[0])).toBe(true);
    expect(full[0]).toMatchObject({
      scannedCount: 0,
      totalReports: 6,
      activeEvaluation: null,
      nativeSafeCount: 0,
      dampenedSafeCount: 0,
      totalSafeCount: 0,
      unsafeCount: 0,
    });
    expect(full[6]).toMatchObject({
      scannedCount: 6,
      totalReports: 6,
      nativeSafeCount: 2,
      dampenedSafeCount: 2,
      totalSafeCount: 4,
      unsafeCount: 2,
    });
    expect(full[6]!.activeEvaluation?.report).toBe(reports[5]);

    const sampled3 = traceDampenedReports(reports, { maxSteps: 3 });
    expect(sampled3.map((f) => f.scannedCount)).toEqual([0, 3, 6]);
    expect(sampled3[2]!.totalSafeCount).toBe(4);
    expect(sampled3[2]!.unsafeCount).toBe(2);

    const single = traceDampenedReports(reports, { maxSteps: 1 });
    expect(single).toHaveLength(1);
    expect(single[0]!.scannedCount).toBe(6);
    expect(single[0]!.totalSafeCount).toBe(4);

    const large = generateSeededReports(250, 99);
    const bounded = traceDampenedReports(large);
    expect(bounded).toHaveLength(DEFAULT_MAX_TRACE_STEPS);
    expect(bounded[bounded.length - 1]!.totalSafeCount).toBe(countDampenedSafeReports(large));
  });

  it('rejects invalid maxSteps and malformed inputs', () => {
    const reports = solver.parse(EXAMPLE_INPUT);
    expect(() => traceDampenedReports(reports, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => traceDampenedReports(reports, { maxSteps: 1.5 })).toThrow(RangeError);
    expect(() => solver.parse('   ')).toThrow(Error);
    expect(() => solver.parse('1 2 x')).toThrow(Error);
  });

  it('matches independent oracle across 1,000 seeded reports', () => {
    const reports = generateSeededReports(1000, 202412029);
    let expected = 0;
    for (const report of reports) {
      if (isDampenedSafeOracle(report.levels)) expected += 1;
    }
    expect(countDampenedSafeReports(reports)).toBe(expected);
  });
});
