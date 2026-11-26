import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import {
  AT_LEAST_PAIR_POLICY,
  EXACT_PAIR_POLICY,
  countMatchingPasswords,
} from '../../shared';
import { solver } from './index';

function bruteForceCount(low: number, high: number, exactPair: boolean): number {
  let count = 0;
  for (let n = low; n <= high; n += 1) {
    const s = String(n);
    let monotone = true;
    for (let i = 1; i < s.length; i += 1) {
      if (s[i]! < s[i - 1]!) {
        monotone = false;
        break;
      }
    }
    if (!monotone) continue;
    const runs = s.match(/(.)\1*/g)!;
    if (runs.some((run) => (exactPair ? run.length === 2 : run.length >= 2))) {
      count += 1;
    }
  }
  return count;
}

function nextSeed(seed: number): number {
  return (Math.imul(seed, 1_664_525) + 1_013_904_223) >>> 0;
}

describe('2019 Day 4 Part 2 solver', () => {
  it('binds EXACT_PAIR_POLICY and matches official single-point and manifest examples', () => {
    expect(Object.isFrozen(solver)).toBe(true);
    expect(solver.policy).toBe(EXACT_PAIR_POLICY);

    const singlePoints: readonly [string, number][] = [
      ['112233-112233', 1],
      ['123444-123444', 0],
      ['111122-111122', 1],
      ['223450-223450', 0],
      ['123789-123789', 0],
    ];
    for (const [input, expected] of singlePoints) {
      expect(solver.solve(solver.parse(input))).toBe(expected);
    }

    expect(executeSolver(solver, '111111-123789').answer).toBe(533);
  });

  it('matches the Part 1 vs Part 2 divergence table', () => {
    const cases: readonly [string, number, number][] = [
      ['111111', 1, 0],
      ['123444', 1, 0],
      ['111222', 1, 0],
      ['111122', 1, 1],
      ['112222', 1, 1],
      ['111223', 1, 1],
      ['122333', 1, 1],
      ['112233', 1, 1],
      ['111199', 1, 1],
    ];
    for (const [code, p1Expected, p2Expected] of cases) {
      const range = solver.parse(`${code}-${code}`);
      expect(countMatchingPasswords(range, AT_LEAST_PAIR_POLICY)).toBe(p1Expected);
      expect(solver.solve(range)).toBe(p2Expected);
    }
  });

  it('handles upper bounds, zero-monotone ranges, full universe, and trace sampling', () => {
    const upperTwo = solver.parse('999998-999999');
    expect(solver.solve(upperTwo)).toBe(0);
    const upperTwoFrames = solver.trace(upperTwo);
    expect(upperTwoFrames.map((f) => f.candidate.value)).toEqual([999_999]);
    expect(upperTwoFrames[0]?.accepted).toBe(false);
    expect(upperTwoFrames[0]?.skippedIntegers).toBe(1);

    const upperOne = solver.parse('999999-999999');
    expect(solver.solve(upperOne)).toBe(0);
    expect(solver.trace(upperOne)[0]?.skippedIntegers).toBe(0);

    const empty = solver.parse('200000-210000');
    expect(solver.solve(empty)).toBe(0);
    expect(solver.trace(empty)).toEqual([]);

    expect(solver.solve(solver.parse('100000-999999'))).toBe(2046);

    const tenStepFrames = solver.trace(solver.parse('111111-111122'));
    expect(tenStepFrames).toHaveLength(10);
    expect(tenStepFrames.map((f) => f.accepted)).toEqual([
      false, false, false, false, false, false, false, false, false, true,
    ]);
    expect(tenStepFrames[9]?.candidate.value).toBe(111_122);
    expect(tenStepFrames[9]?.matchedCount).toBe(1);

    const sampled = solver.trace(solver.parse('111111-123789'), { maxSteps: 10 });
    expect(sampled).toHaveLength(10);
    expect(sampled[0]?.stepIndex).toBe(0);
    expect(sampled[9]?.matchedCount).toBe(533);
    expect(sampled[0]?.totalCandidates).toBeGreaterThan(10);
  });

  it('rejects malformed inputs, out-of-bounds ranges, and invalid maxSteps', () => {
    expect(() => solver.parse('')).toThrow(SyntaxError);
    expect(() => solver.parse('12345-67890')).toThrow(SyntaxError);
    expect(() => solver.parse('099999-200000')).toThrow(RangeError);
    expect(() => solver.parse('200000-199999')).toThrow(RangeError);
    const valid = solver.parse('111111-123789');
    expect(() => solver.trace(valid, { maxSteps: 0 })).toThrow(RangeError);
  });

  it('matches an independent decimal brute-force oracle and P2 <= P1 across 30 seeded ranges', () => {
    let seed = 20_190_402;
    for (let trial = 0; trial < 30; trial += 1) {
      seed = nextSeed(seed);
      const low = 100_000 + (seed % 880_000);
      seed = nextSeed(seed);
      const high = Math.min(999_999, low + (seed % 20_000));
      const range = solver.parse(`${low}-${high}`);

      const p1 = countMatchingPasswords(range, AT_LEAST_PAIR_POLICY);
      const p2 = solver.solve(range);
      expect(p2).toBe(bruteForceCount(low, high, true));
      expect(p2).toBeLessThanOrEqual(p1);
    }
  });
});
