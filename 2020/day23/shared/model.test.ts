import { describe, expect, it } from 'vitest';
import { CupRingSpec, MIN_CUP_COUNT, parseCupLabels } from './model';

describe('2020 Day 23 model', () => {
  it('parses valid cup digits and freezes the resulting CupRingSpec', () => {
    const spec = parseCupLabels('  389125467\n');
    expect(spec.count).toBe(9);
    expect(spec.firstCup).toBe(3);
    expect(spec.labels).toEqual([3, 8, 9, 1, 2, 5, 4, 6, 7]);
    expect(Object.isFrozen(spec)).toBe(true);
    expect(Object.isFrozen(spec.labels)).toBe(true);
  });

  it('supports minimum cup count of 4', () => {
    const spec = parseCupLabels('4213');
    expect(MIN_CUP_COUNT).toBe(4);
    expect(spec.count).toBe(4);
    expect(spec.firstCup).toBe(4);
  });

  it('rejects malformed raw strings', () => {
    expect(() => parseCupLabels('')).toThrow();
    expect(() => parseCupLabels('   ')).toThrow();
    expect(() => parseCupLabels('12034')).toThrow();
    expect(() => parseCupLabels('12a4')).toThrow();
    expect(() => parseCupLabels('12 34')).toThrow();
  });

  it('rejects invalid CupRingSpec labels (too few, out-of-range, non-integer, duplicate)', () => {
    expect(() => new CupRingSpec([1, 2, 3])).toThrow(RangeError);
    expect(() => new CupRingSpec([1, 2, 3, 1.5])).toThrow(RangeError);
    expect(() => new CupRingSpec([0, 1, 2, 3])).toThrow(RangeError);
    expect(() => new CupRingSpec([1, 2, 3, 5])).toThrow(RangeError);
    expect(() => new CupRingSpec([1, 2, 3, 2])).toThrow(RangeError);
  });
});
