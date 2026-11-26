import { describe, expect, it } from 'vitest';
import {
  COHORT_COUNT,
  LanternfishSchool,
  TIMER_BUCKETS,
  validateSimulationDays,
  type CohortTuple,
  type TimerBucket,
} from './school';

function naiveAdvance(initial: readonly TimerBucket[], days: number): readonly TimerBucket[] {
  let fish = [...initial];
  for (let d = 0; d < days; d += 1) {
    const newborns: TimerBucket[] = [];
    for (let i = 0; i < fish.length; i += 1) {
      const t = fish[i]!;
      if (t === 0) {
        fish[i] = 6;
        newborns.push(8);
      } else {
        fish[i] = (t - 1) as TimerBucket;
      }
    }
    fish = [...fish, ...newborns];
  }
  return fish;
}

function lcg(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state;
  };
}

describe('school', () => {
  it('exposes 9 frozen timer buckets and validates simulation days', () => {
    expect(COHORT_COUNT).toBe(9);
    expect(TIMER_BUCKETS).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    expect(Object.isFrozen(TIMER_BUCKETS)).toBe(true);
    expect(validateSimulationDays(0)).toBe(0);
    expect(validateSimulationDays(80)).toBe(80);
    for (const bad of [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1]) {
      expect(() => validateSimulationDays(bad)).toThrow(RangeError);
    }
  });

  it('matches official example counts across days 0, 1, 18, 80, and 256', () => {
    const school = LanternfishSchool.fromTimers([3, 4, 3, 1, 2]);
    expect(school.totalPopulation).toBe(5n);
    expect(school.advance(0)).toBe(school);
    expect(school.advance(1).counts).toEqual([1n, 1n, 2n, 1n, 0n, 0n, 0n, 0n, 0n]);
    expect(school.advance(18).totalPopulation).toBe(26n);
    expect(school.advance(80).totalPopulation).toBe(5934n);
    expect(school.advance(256).totalPopulation).toBe(26984457539n);
  });

  it('matches independent naive per-fish oracle for days 0..18 and seeded cohorts 0..25', () => {
    const sample: readonly TimerBucket[] = [3, 4, 3, 1, 2];
    const school = LanternfishSchool.fromTimers(sample);
    for (let d = 0; d <= 18; d += 1) {
      expect(school.advance(d).totalPopulation).toBe(BigInt(naiveAdvance(sample, d).length));
    }
    const nextRand = lcg(202106);
    for (let trial = 0; trial < 5; trial += 1) {
      const timers = Array.from({ length: 8 }, () => (nextRand() % 9) as TimerBucket);
      const s = LanternfishSchool.fromTimers(timers);
      for (let d = 0; d <= 25; d += 5) {
        const expected = LanternfishSchool.fromTimers(naiveAdvance(timers, d));
        expect(s.advance(d).counts).toEqual(expected.counts);
      }
    }
  });

  it('computes derived getters, preserves immutability, handles >2^1024, and rejects invalid inputs', () => {
    const zero = LanternfishSchool.fromTimers([]);
    expect(zero.totalPopulation).toBe(0n);
    expect(zero.maxCohortCount).toBe(0n);
    expect(zero.spawningCount).toBe(0n);
    expect(zero.newbornCount).toBe(0n);

    const raw: [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint] = [
      5n, 1n, 0n, 0n, 0n, 0n, 0n, 0n, 2n,
    ];
    const s1 = new LanternfishSchool(raw);
    raw[0] = 999n;
    expect(s1.countAt(0)).toBe(5n);
    expect(s1.spawningCount).toBe(5n);
    expect(s1.newbornCount).toBe(2n);
    expect(s1.maxCohortCount).toBe(5n);
    expect(Object.isFrozen(s1)).toBe(true);
    expect(Object.isFrozen(s1.counts)).toBe(true);

    const s2 = new LanternfishSchool([0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 1n << 1100n]);
    expect(s2.maxCohortCount).toBe(1n << 1100n);
    expect(s2.advance(1).countAt(7)).toBe(1n << 1100n);

    const neg: CohortTuple = [0n, 0n, -1n, 0n, 0n, 0n, 0n, 0n, 0n];
    expect(() => new LanternfishSchool(neg)).toThrow(RangeError);
    expect(() => s1.advance(-2)).toThrow(RangeError);
  });
});
