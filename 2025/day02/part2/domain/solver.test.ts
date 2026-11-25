import { describe, expect, it } from 'vitest';
import { IdRange } from '../../shared';
import { DEFAULT_MAX_BAND_SAMPLES, solver, squarefreeRepeatTerms } from './index';

const EXAMPLE_INPUT =
  '11-22,95-115,998-1012,1188511880-1188511890,222220-222224,1698522-1698528,' +
  '446443-446449,38593856-38593862,565653-565659,824824821-824824827,2121212118-2121212124';

function bruteForceSum(raw: string): bigint {
  let total = 0n;
  for (const r of solver.parse(raw)) {
    for (let n = Number(r.start); n <= Number(r.end); n += 1) {
      const s = String(n);
      if ((s + s).indexOf(s, 1) < s.length) total += BigInt(n);
    }
  }
  return total;
}

describe('squarefreeRepeatTerms', () => {
  it('computes signed Möbius terms and rejects non-positive or non-safe integers', () => {
    expect(squarefreeRepeatTerms(1)).toEqual([]);
    expect(squarefreeRepeatTerms(2)).toEqual([{ patternLength: 1, repeats: 2, sign: 1n }]);
    expect(squarefreeRepeatTerms(4)).toEqual([{ patternLength: 2, repeats: 2, sign: 1n }]);
    expect(squarefreeRepeatTerms(9)).toEqual([{ patternLength: 3, repeats: 3, sign: 1n }]);
    expect(squarefreeRepeatTerms(6)).toEqual([{ patternLength: 3, repeats: 2, sign: 1n }, { patternLength: 2, repeats: 3, sign: 1n }, { patternLength: 1, repeats: 6, sign: -1n }]);
    expect(squarefreeRepeatTerms(10)).toEqual([{ patternLength: 5, repeats: 2, sign: 1n }, { patternLength: 2, repeats: 5, sign: 1n }, { patternLength: 1, repeats: 10, sign: -1n }]);
    expect(squarefreeRepeatTerms(12)).toEqual([{ patternLength: 6, repeats: 2, sign: 1n }, { patternLength: 4, repeats: 3, sign: 1n }, { patternLength: 2, repeats: 6, sign: -1n }]);
    const terms30 = squarefreeRepeatTerms(30);
    expect(terms30).toHaveLength(7);
    expect(terms30.at(-1)).toEqual({ patternLength: 1, repeats: 30, sign: 1n });
    for (const bad of [0, -3, 2.5, Number.NaN]) expect(() => squarefreeRepeatTerms(bad)).toThrow(RangeError);
  });
});

describe('2025 Day 2 Part 2 solver', () => {
  it('solves the official example, boundaries, overlaps, L=12, and 30-digit BigInt values', () => {
    expect(solver.solve(solver.parse(EXAMPLE_INPUT))).toBe(4174379265n);
    expect(solver.solve(solver.parse('1-9'))).toBe(0n);
    expect(solver.solve(solver.parse('222220-222224'))).toBe(222222n);
    expect(solver.solve(solver.parse('1111111110-1111111112'))).toBe(1111111111n);
    expect(solver.solve(solver.parse('111111111111-111111111111,121212121212-121212121212'))).toBe(232323232323n);
    expect(solver.solve(solver.parse('123123123123-123123123123,123412341234-123412341234'))).toBe(246535464357n);
    const allOnes30 = BigInt('1'.repeat(30));
    const alt12x15 = BigInt('12'.repeat(15));
    expect(solver.solve([new IdRange(allOnes30, allOnes30), new IdRange(alt12x15, alt12x15)])).toBe(allOnes30 + alt12x15);
  });

  it('matches brute-force periodicity oracle across overlapping ranges', () => {
    for (const input of [EXAMPLE_INPUT, '1-1500', '99900-101100', '222100-222300', '565500-565700']) {
      expect(solver.solve(solver.parse(input))).toBe(bruteForceSum(input));
    }
  });

  it('produces full, sampled, single-frame, empty, and sample-capped traces and validates maxSteps', () => {
    const full = solver.trace!(solver.parse('1-9,222220-222224,1-99'));
    expect(full).toHaveLength(4);
    expect(full[0]).toMatchObject({ step: 0, range: null, checkedDigitLengths: [], bands: [], cumulativeSum: 0n });
    expect(full[1]).toMatchObject({ step: 1, checkedDigitLengths: [], bands: [], rangeMatchCount: 0n, cumulativeSum: 0n });
    expect(full[2]).toMatchObject({ step: 2, checkedDigitLengths: [6], rangeMatchCount: 1n, rangeSum: 222222n });
    expect(full[2]!.bands.map((b) => [b.band.repeats, b.sign])).toEqual([[2, 1n], [3, 1n], [6, -1n]]);
    expect(full[3]!.bands[0]!.samplePatterns).toHaveLength(DEFAULT_MAX_BAND_SAMPLES);
    expect(full[3]!.cumulativeSum).toBe(222222n + 495n);
    const sampled = solver.trace!(solver.parse('11-22,95-115,998-1012,1-9,10-12'), { maxSteps: 3 });
    expect(sampled.length).toBeLessThanOrEqual(3);
    expect(sampled.at(-1)).toMatchObject({ step: 5, cumulativeSum: 2263n });
    expect(solver.trace!(solver.parse('11-22,95-115'), { maxSteps: 1 })).toEqual([
      expect.objectContaining({ step: 2, cumulativeSum: 243n }),
    ]);
    expect(solver.trace!([])).toEqual([
      { step: 0, range: null, checkedDigitLengths: [], bands: [], rangeMatchCount: 0n, rangeSum: 0n, cumulativeMatchCount: 0n, cumulativeSum: 0n },
    ]);
    for (const bad of [0, -1, 1.5]) expect(() => solver.trace!(solver.parse('11-22'), { maxSteps: bad })).toThrow(RangeError);
  });
});
