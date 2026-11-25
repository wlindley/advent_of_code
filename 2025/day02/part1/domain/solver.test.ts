import { describe, expect, it } from 'vitest';
import { IdRange } from '../../shared';
import { DEFAULT_MAX_BAND_SAMPLES, solver } from './index';

const EXAMPLE_INPUT =
  '11-22,95-115,998-1012,1188511880-1188511890,222220-222224,1698522-1698528,' +
  '446443-446449,38593856-38593862,565653-565659,824824821-824824827,2121212118-2121212124';

function bruteForceSum(raw: string): bigint {
  let total = 0n;
  for (const r of solver.parse(raw)) {
    for (let n = Number(r.start); n <= Number(r.end); n += 1) {
      const s = String(n);
      if (s.length % 2 === 0 && s.slice(0, s.length / 2) === s.slice(s.length / 2)) {
        total += BigInt(n);
      }
    }
  }
  return total;
}

describe('2025 Day 2 Part 1 solver', () => {
  it('solves the official example input', () => {
    expect(solver.solve(solver.parse(EXAMPLE_INPUT))).toBe(1227775554n);
  });

  it('handles odd-only, single-hit, adjacent-miss, multi-band, and 20-digit BigInt ranges', () => {
    expect(solver.solve(solver.parse('1-9,100-999'))).toBe(0n);
    expect(solver.solve(solver.parse('11-11'))).toBe(11n);
    expect(solver.solve(solver.parse('10-10,12-21'))).toBe(0n);
    expect(solver.solve(solver.parse('9-1010'))).toBe(1505n);
    const huge = solver.parse('10000000000000000000-10000000021000000002');
    expect(solver.solve(huge)).toBe((10n ** 10n + 1n) * 3000000003n);
  });

  it('matches brute-force string-half oracle across boundary ranges', () => {
    for (const input of [EXAMPLE_INPUT, '1-1200', '9980-10200', '99990-101010']) {
      expect(solver.solve(solver.parse(input))).toBe(bruteForceSum(input));
    }
  });

  it('produces full, sampled, single-frame, empty, and sample-capped traces', () => {
    const ranges = solver.parse('9-1010,12-21,1-99');
    const full = solver.trace!(ranges);
    expect(full).toHaveLength(4);
    expect(full[0]).toMatchObject({ step: 0, range: null, checkedHalfLengths: [], bands: [], cumulativeSum: 0n });
    expect(full[1]).toMatchObject({ step: 1, checkedHalfLengths: [1, 2], rangeMatchCount: 10n, rangeSum: 1505n });
    expect(full[2]).toMatchObject({ step: 2, checkedHalfLengths: [1], bands: [], rangeMatchCount: 0n, cumulativeSum: 1505n });
    expect(full[3]!.bands[0]!.samplePatterns).toHaveLength(DEFAULT_MAX_BAND_SAMPLES);
    expect(full[3]!.cumulativeSum).toBe(2000n);

    const sampled = solver.trace!(solver.parse('11-22,95-115,998-1012,1-9,10-12'), { maxSteps: 3 });
    expect(sampled.length).toBeLessThanOrEqual(3);
    expect(sampled.at(-1)).toMatchObject({ step: 5, cumulativeSum: 1153n });

    const single = solver.trace!(ranges, { maxSteps: 1 });
    expect(single).toHaveLength(1);
    expect(single[0]!.step).toBe(3);

    expect(solver.trace!([])).toEqual([
      { step: 0, range: null, checkedHalfLengths: [], bands: [], rangeMatchCount: 0n, rangeSum: 0n, cumulativeMatchCount: 0n, cumulativeSum: 0n },
    ]);
    expect(solver.trace!([new IdRange(11n, 22n)], { maxSteps: 1 })[0]!.cumulativeSum).toBe(33n);
  });

  it('rejects invalid trace maxSteps', () => {
    const ranges = solver.parse('11-22');
    expect(() => solver.trace!(ranges, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => solver.trace!(ranges, { maxSteps: 1.5 })).toThrow(RangeError);
  });
});
