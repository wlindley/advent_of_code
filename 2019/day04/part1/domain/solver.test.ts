import { describe, expect, it } from 'vitest';
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
    const hasMatch = runs.some((run) => (exactPair ? run.length === 2 : run.length >= 2));
    if (hasMatch) count += 1;
  }
  return count;
}

function nextSeed(seed: number): number {
  return (Math.imul(seed, 1_664_525) + 1_013_904_223) >>> 0;
}

describe('2019 Day 4 Part 1 solver', () => {
  it('matches official single-point and manifest examples', () => {
    expect(solver.solve(solver.parse('111111-111111'))).toBe(1);
    expect(solver.solve(solver.parse('223450-223450'))).toBe(0);
    expect(solver.solve(solver.parse('123789-123789'))).toBe(0);
    expect(solver.solve(solver.parse('111111-123789'))).toBe(674);
    expect(countMatchingPasswords(solver.parse('111111-123789'), EXACT_PAIR_POLICY)).toBe(533);
  });

  it('handles upper bounds, zero-monotone ranges, and the full 6-digit universe', () => {
    const upperTwo = solver.parse('999998-999999');
    expect(solver.solve(upperTwo)).toBe(1);
    expect(solver.trace(upperTwo).map((frame) => frame.candidate.value)).toEqual([999_999]);

    const upperOne = solver.parse('999999-999999');
    expect(solver.solve(upperOne)).toBe(1);
    expect(solver.trace(upperOne).map((frame) => frame.candidate.value)).toEqual([999_999]);

    const empty = solver.parse('200000-210000');
    expect(solver.solve(empty)).toBe(0);
    expect(solver.trace(empty)).toEqual([]);

    expect(solver.solve(solver.parse('100000-999999'))).toBe(2919);
  });

  it('matches an independent decimal brute-force oracle across 30 seeded ranges for both policies', () => {
    let seed = 20_190_401;
    for (let trial = 0; trial < 30; trial += 1) {
      seed = nextSeed(seed);
      const low = 100_000 + (seed % 880_000);
      seed = nextSeed(seed);
      const high = Math.min(999_999, low + (seed % 20_000));
      const range = solver.parse(`${low}-${high}`);

      expect(solver.solve(range)).toBe(bruteForceCount(low, high, false));
      expect(countMatchingPasswords(range, AT_LEAST_PAIR_POLICY)).toBe(
        bruteForceCount(low, high, false),
      );
      expect(countMatchingPasswords(range, EXACT_PAIR_POLICY)).toBe(
        bruteForceCount(low, high, true),
      );
    }
  });
});
