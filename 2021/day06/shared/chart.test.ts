import { describe, expect, it } from 'vitest';
import {
  TIMER_ROLES,
  buildCohortBars,
  buildGrowthCurve,
  formatCompactBigInt,
  formatGroupedBigInt,
  scaleBigIntRatio,
} from './chart';
import { LanternfishSchool } from './school';
import { LanternfishTraceFrame, traceLanternfish } from './simulation';

describe('chart', () => {
  it('defines frozen 9-tuple TIMER_ROLES across all cohort roles', () => {
    expect(TIMER_ROLES).toEqual([
      'spawning',
      'mature',
      'mature',
      'mature',
      'mature',
      'mature',
      'reset',
      'juvenile',
      'newborn',
    ]);
    expect(Object.isFrozen(TIMER_ROLES)).toBe(true);
  });

  it('scales BigInt ratios safely and rejects invalid bounds', () => {
    expect(scaleBigIntRatio(0n, 0n)).toBe(0);
    expect(scaleBigIntRatio(1n, 2n)).toBe(0.5);
    expect(scaleBigIntRatio(1n << 1100n, 1n << 1101n)).toBe(0.5);
    expect(() => scaleBigIntRatio(-1n, 10n)).toThrow(RangeError);
    expect(() => scaleBigIntRatio(1n, -1n)).toThrow(RangeError);
    expect(() => scaleBigIntRatio(11n, 10n)).toThrow(RangeError);
  });

  it('formats grouped and compact BigInts across all suffix tiers and rejects negatives', () => {
    expect(formatGroupedBigInt(0n)).toBe('0');
    expect(formatGroupedBigInt(5934n)).toBe('5,934');
    expect(formatGroupedBigInt(26984457539n)).toBe('26,984,457,539');

    expect(formatCompactBigInt(0n)).toBe('0');
    expect(formatCompactBigInt(999n)).toBe('999');
    expect(formatCompactBigInt(1000n)).toBe('1K');
    expect(formatCompactBigInt(5934n)).toBe('5.93K');
    expect(formatCompactBigInt(2_500_000n)).toBe('2.5M');
    expect(formatCompactBigInt(26_984_457_539n)).toBe('26.98B');
    expect(formatCompactBigInt(3_000_000_000_000n)).toBe('3T');
    expect(formatCompactBigInt(4_250_000_000_000_000n)).toBe('4.25Q');
    expect(formatCompactBigInt(10n ** 18n)).toBe('1.00e18');
    expect(formatCompactBigInt(12345n * 10n ** 1100n)).toBe('1.23e1104');

    expect(() => formatGroupedBigInt(-1n)).toThrow(RangeError);
    expect(() => formatCompactBigInt(-1n)).toThrow(RangeError);
  });

  it('builds 9 cohort bars for non-empty and all-zero schools', () => {
    const school = LanternfishSchool.fromTimers([0, 3, 3, 6, 7, 8]);
    const bars = buildCohortBars(school);
    expect(bars).toHaveLength(9);
    expect(bars[0]).toEqual({
      timer: 0,
      count: 1n,
      ratio: 0.5,
      compactLabel: '1',
      role: 'spawning',
    });
    expect(bars[3]?.ratio).toBe(1);
    expect(bars[8]?.role).toBe('newborn');

    const emptyBars = buildCohortBars(LanternfishSchool.fromTimers([]));
    expect(emptyBars.every((b) => b.ratio === 0 && b.count === 0n)).toBe(true);
  });

  it('builds linear and log growth curves and rejects empty trace frames', () => {
    const frames = traceLanternfish(LanternfishSchool.fromTimers([3, 4, 3, 1, 2]), 80);
    const linear = buildGrowthCurve(frames, 'linear');
    expect(linear.scaleMode).toBe('linear');
    expect(linear.maxPopulation).toBe(5934n);
    expect(linear.points[0]?.ratio).toBeCloseTo(5 / 5934, 5);
    expect(linear.points[80]?.ratio).toBe(1);

    const log = buildGrowthCurve(frames, 'log');
    expect(log.scaleMode).toBe('log');
    expect(log.points[0]!.ratio).toBeGreaterThan(0.1);
    expect(log.points[80]?.ratio).toBe(1);

    const zeroCurve = buildGrowthCurve([new LanternfishTraceFrame(0, LanternfishSchool.fromTimers([]))], 'log');
    expect(zeroCurve.points[0]?.ratio).toBe(0);
    expect(() => buildGrowthCurve([], 'linear')).toThrow(RangeError);
  });
});
