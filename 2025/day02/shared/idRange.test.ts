import { describe, expect, it } from 'vitest';
import { IdRange, RepeatedPatternBand, parseIdRanges, repeatMultiplier } from './index';

describe('repeatMultiplier', () => {
  it('computes exact BigInt multipliers and validates inputs', () => {
    expect(repeatMultiplier(1, 2)).toBe(11n);
    expect(repeatMultiplier(2, 2)).toBe(101n);
    expect(repeatMultiplier(1, 3)).toBe(111n);
    expect(repeatMultiplier(2, 3)).toBe(10101n);
    expect(repeatMultiplier(20, 2)).toBe(10n ** 20n + 1n);
    expect(() => repeatMultiplier(0, 2)).toThrow(RangeError);
    expect(() => repeatMultiplier(1.5, 2)).toThrow(RangeError);
    expect(() => repeatMultiplier(1, 1)).toThrow(RangeError);
    expect(() => repeatMultiplier(1, 2.5)).toThrow(RangeError);
  });
});

describe('RepeatedPatternBand', () => {
  it('computes derived getters for even, odd, and single-hit bands and validates bounds', () => {
    const even = new RepeatedPatternBand(2, 2, 10n, 13n);
    expect(Object.isFrozen(even)).toBe(true);
    expect([even.digitLength, even.multiplier, even.count, even.sum]).toEqual([4, 101n, 4n, 4646n]);
    const odd = new RepeatedPatternBand(1, 2, 2n, 4n);
    expect([odd.count, odd.sum]).toEqual([3n, 99n]);
    const single = new RepeatedPatternBand(1, 3, 5n, 5n);
    expect([single.digitLength, single.count, single.sum]).toEqual([3, 1n, 555n]);
    expect(() => new RepeatedPatternBand(0, 2, 1n, 2n)).toThrow(RangeError);
    expect(() => new RepeatedPatternBand(1, 1, 1n, 2n)).toThrow(RangeError);
    expect(() => new RepeatedPatternBand(2, 2, 9n, 12n)).toThrow(RangeError);
    expect(() => new RepeatedPatternBand(2, 2, 90n, 100n)).toThrow(RangeError);
    expect(() => new RepeatedPatternBand(2, 2, 20n, 19n)).toThrow(RangeError);
  });

  it('samples full, head+tail, and limit=1 patterns and rejects invalid limits', () => {
    const small = new RepeatedPatternBand(2, 2, 10n, 13n);
    expect(small.samplePatterns(4)).toEqual([10n, 11n, 12n, 13n]);
    expect(small.samplePatterns(6)).toEqual([10n, 11n, 12n, 13n]);
    const wide = new RepeatedPatternBand(1, 2, 1n, 9n);
    expect(wide.samplePatterns(5)).toEqual([1n, 2n, 3n, 8n, 9n]);
    expect(wide.samplePatterns(4)).toEqual([1n, 2n, 8n, 9n]);
    expect(wide.samplePatterns(1)).toEqual([1n]);
    expect(() => wide.samplePatterns(0)).toThrow(RangeError);
    expect(() => wide.samplePatterns(1.5)).toThrow(RangeError);
  });
});

describe('IdRange and parseIdRanges', () => {
  it('computes clamped bands, misses, metadata, and rejects invalid bounds', () => {
    const r1 = new IdRange(95n, 115n);
    expect(Object.isFrozen(r1)).toBe(true);
    expect([r1.label, r1.minDigits, r1.maxDigits]).toEqual(['95-115', 2, 3]);
    expect(r1.repeatedPatternBand(1, 2)).toMatchObject({ minPattern: 9n, maxPattern: 9n });
    expect(new IdRange(998n, 1012n).repeatedPatternBand(2, 2)).toMatchObject({ minPattern: 10n, maxPattern: 10n });
    expect(new IdRange(12n, 21n).repeatedPatternBand(1, 2)).toBeNull();
    expect(new IdRange(1n, 9n).repeatedPatternBand(1, 2)).toBeNull();
    expect(new IdRange(100n, 999n).repeatedPatternBand(2, 2)).toBeNull();
    expect(() => new IdRange(0n, 5n)).toThrow(RangeError);
    expect(() => new IdRange(10n, 5n)).toThrow(RangeError);
  });

  it('parses strict range tokens and comma-separated inputs', () => {
    expect(parseIdRanges(' 11-22,95-115 \n')).toEqual([new IdRange(11n, 22n), new IdRange(95n, 115n)]);
    for (const bad of ['01-22', '11-022', '11', ' 11-22']) {
      expect(() => IdRange.parse(bad)).toThrow();
    }
    expect(() => IdRange.parse('22-11')).toThrow(RangeError);
    expect(() => parseIdRanges('   ')).toThrow('at least one range');
    expect(() => parseIdRanges('11-22,bad')).toThrow('Range 2:');
  });
});
