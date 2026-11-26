import { describe, expect, it } from 'vitest';
import { COHORT_COUNT, LanternfishSchool, type CohortTuple } from './school';
import {
  DEFAULT_MAX_TRACE_STEPS,
  LanternfishSolver,
  LanternfishTraceFrame,
  PART1_DAYS,
  PART2_DAYS,
  traceLanternfish,
} from './simulation';

type Matrix9 = readonly (readonly bigint[])[];

function buildTransitionMatrix(): Matrix9 {
  return Array.from({ length: COHORT_COUNT }, (_, r) =>
    Array.from({ length: COHORT_COUNT }, (_, c) =>
      c === r + 1 || (c === 0 && (r === 6 || r === 8)) ? 1n : 0n,
    ),
  );
}

function matMul(a: Matrix9, b: Matrix9): Matrix9 {
  return Array.from({ length: COHORT_COUNT }, (_, r) =>
    Array.from({ length: COHORT_COUNT }, (_, c) => {
      let sum = 0n;
      for (let k = 0; k < COHORT_COUNT; k += 1) sum += a[r]![k]! * b[k]![c]!;
      return sum;
    }),
  );
}

function matPow(base: Matrix9, exp: number): Matrix9 {
  let result: Matrix9 = Array.from({ length: COHORT_COUNT }, (_, r) =>
    Array.from({ length: COHORT_COUNT }, (_, c) => (r === c ? 1n : 0n)),
  );
  let cur = base;
  for (let e = exp; e > 0; e = Math.floor(e / 2)) {
    if (e % 2 === 1) result = matMul(result, cur);
    if (e > 1) cur = matMul(cur, cur);
  }
  return result;
}

function matVec(m: Matrix9, v: CohortTuple): CohortTuple {
  return m.map((row) => row.reduce((acc, cell, c) => acc + cell * v[c]!, 0n)) as unknown as CohortTuple;
}

describe('simulation', () => {
  it('matches 9x9 BigInt companion-matrix exponentiation oracle across basis & >2^64 distributions', () => {
    const m = buildTransitionMatrix();
    let seed = 987654321;
    const next64 = () => {
      seed = (1664525 * seed + 1013904223) >>> 0;
      const hi = BigInt(seed);
      seed = (1664525 * seed + 1013904223) >>> 0;
      return (hi << 33n) + BigInt(seed);
    };
    const vectors: CohortTuple[] = Array.from({ length: 9 }, (_, idx) =>
      Array.from({ length: 9 }, (_, j) => (idx === j ? 1n : 0n)) as unknown as CohortTuple,
    );
    for (let i = 0; i < 25; i += 1) {
      vectors.push(Array.from({ length: 9 }, () => next64()) as unknown as CohortTuple);
    }
    for (const days of [0, 1, 18, 80, 256, 1000]) {
      const mPow = matPow(m, days);
      for (const vec of vectors) {
        expect(new LanternfishSchool(vec).advance(days).counts).toEqual(matVec(mPow, vec));
      }
    }
  });

  it('computes frame derived getters accurately on day 0 and subsequent days', () => {
    const day0School = new LanternfishSchool([2n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 5n]);
    const frame0 = new LanternfishTraceFrame(0, day0School);
    expect(Object.isFrozen(frame0)).toBe(true);
    expect(frame0.totalPopulation).toBe(7n);
    expect(frame0.spawningNext).toBe(2n);
    expect(frame0.spawnedToday).toBe(0n);

    const frame1 = new LanternfishTraceFrame(1, day0School.advance(1));
    expect(frame1.spawnedToday).toBe(2n);
    expect(frame1.totalPopulation).toBe(9n);
    expect(() => new LanternfishTraceFrame(-1, day0School)).toThrow(RangeError);
  });

  it('traces full and sampled trajectories and validates options', () => {
    expect(PART1_DAYS).toBe(80);
    expect(PART2_DAYS).toBe(256);
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(257);
    const school = LanternfishSchool.fromTimers([3, 4, 3, 1, 2]);

    const zeroFrames = traceLanternfish(school, 0);
    expect(zeroFrames).toHaveLength(1);
    expect(zeroFrames[0]?.day).toBe(0);

    const defaultFrames = traceLanternfish(school, 256, {});
    expect(defaultFrames).toHaveLength(257);
    expect(defaultFrames[256]?.totalPopulation).toBe(26984457539n);

    const oneFrame = traceLanternfish(school, 80, { maxSteps: 1 });
    expect(oneFrame).toHaveLength(1);
    expect(oneFrame[0]?.day).toBe(80);
    expect(oneFrame[0]?.totalPopulation).toBe(5934n);

    const tenFrames = traceLanternfish(school, 80, { maxSteps: 10 });
    expect(tenFrames).toHaveLength(10);
    expect(tenFrames[0]?.day).toBe(0);
    expect(tenFrames[9]?.day).toBe(80);

    expect(() => traceLanternfish(school, -1)).toThrow(RangeError);
    expect(() => traceLanternfish(school, 10, { maxSteps: 0 })).toThrow(RangeError);
  });

  it('exposes frozen LanternfishSolver implementing parse, solve, and trace', () => {
    const solver = new LanternfishSolver(PART1_DAYS);
    expect(Object.isFrozen(solver)).toBe(true);
    expect(solver.days).toBe(80);
    const parsed = solver.parse('3,4,3,1,2');
    expect(solver.solve(parsed)).toBe(5934n);
    expect(solver.trace(parsed, { maxSteps: 5 })).toHaveLength(5);
    expect(() => new LanternfishSolver(-1)).toThrow(RangeError);
  });
});
