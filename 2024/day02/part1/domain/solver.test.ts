import { describe, expect, it } from 'vitest';
import { executeSolver, type Clock } from '../../../../shared/core';
import { Report } from '../../shared';
import {
  countSafeReports,
  DEFAULT_MAX_TRACE_STEPS,
  solver,
  traceSafeReports,
} from './solver';

const EXAMPLE_INPUT = [
  '7 6 4 2 1',
  '1 2 7 8 9',
  '9 7 6 2 1',
  '1 3 2 4 5',
  '8 6 4 4 1',
  '1 3 6 7 9',
].join('\n');

function deltaRangeEnvelopeOracle(levels: readonly number[]): boolean {
  if (levels.length < 2) return true;
  let minDelta = Number.POSITIVE_INFINITY;
  let maxDelta = Number.NEGATIVE_INFINITY;
  for (let i = 1; i < levels.length; i += 1) {
    const delta = levels[i]! - levels[i - 1]!;
    if (delta < minDelta) minDelta = delta;
    if (delta > maxDelta) maxDelta = delta;
  }
  return (minDelta >= 1 && maxDelta <= 3) || (minDelta >= -3 && maxDelta <= -1);
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

describe('day02/part1 solver', () => {
  it('solves the official example and executes with a fake clock', () => {
    const parsed = solver.parse(EXAMPLE_INPUT);
    expect(solver.solve(parsed)).toBe(2);

    const exec = executeSolver(solver, EXAMPLE_INPUT, createFakeClock([10, 13.5]));
    expect(exec).toEqual({ answer: 2, elapsedMs: 3.5, runtime: 'main-thread' });
  });

  it('handles an empty report list cleanly in count and trace', () => {
    expect(countSafeReports([])).toBe(0);
    const frames = traceSafeReports([]);
    expect(Object.isFrozen(frames)).toBe(true);
    expect(frames).toEqual([
      { scannedCount: 0, totalReports: 0, activeReport: null, safeCount: 0 },
    ]);
  });

  it('traces full and sampled runs and validates maxSteps', () => {
    const reports = solver.parse(EXAMPLE_INPUT);
    const full = traceSafeReports(reports);
    expect(full).toHaveLength(7);
    expect(full[0]).toEqual({ scannedCount: 0, totalReports: 6, activeReport: null, safeCount: 0 });
    expect(full[6]).toMatchObject({ scannedCount: 6, totalReports: 6, safeCount: 2 });
    expect(full[6]!.activeReport).toBe(reports[5]);
    expect(Object.isFrozen(full[0])).toBe(true);

    const sampled3 = traceSafeReports(reports, { maxSteps: 3 });
    expect(sampled3.map((f) => f.scannedCount)).toEqual([0, 3, 6]);
    expect(sampled3[2]!.safeCount).toBe(2);

    const single = traceSafeReports(reports, { maxSteps: 1 });
    expect(single).toHaveLength(1);
    expect(single[0]!.scannedCount).toBe(6);
    expect(single[0]!.safeCount).toBe(2);

    const large = generateSeededReports(250, 99);
    const bounded = traceSafeReports(large);
    expect(bounded).toHaveLength(DEFAULT_MAX_TRACE_STEPS);
    expect(bounded[bounded.length - 1]!.safeCount).toBe(countSafeReports(large));

    expect(() => traceSafeReports(reports, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => traceSafeReports(reports, { maxSteps: 1.5 })).toThrow(RangeError);
  });

  it('matches independent deltaRangeEnvelopeOracle across 1,000 seeded reports', () => {
    const reports = generateSeededReports(1000, 20241202);
    let expectedSafe = 0;
    for (const report of reports) {
      const oracleSafe = deltaRangeEnvelopeOracle(report.levels);
      expect(report.isSafe).toBe(oracleSafe);
      if (oracleSafe) expectedSafe += 1;
    }
    expect(countSafeReports(reports)).toBe(expectedSafe);
  });
});
