import { describe, expect, it } from 'vitest';
import { ClosedInterval, IntervalUnion } from './index';

describe('ClosedInterval', () => {
  it('supports normal, singleton, negative, and 15-digit intervals', () => {
    const iv = new ClosedInterval(3n, 5n);
    expect(iv.start).toBe(3n);
    expect(iv.end).toBe(5n);
    expect(iv.length).toBe(3n);
    expect(iv.contains(2n)).toBe(false);
    expect(iv.contains(3n)).toBe(true);
    expect(iv.contains(5n)).toBe(true);
    expect(iv.contains(6n)).toBe(false);
    expect(Object.isFrozen(iv)).toBe(true);

    const single = new ClosedInterval(0n, 0n);
    expect(single.length).toBe(1n);
    expect(single.contains(0n)).toBe(true);

    const neg = new ClosedInterval(-5n, -2n);
    expect(neg.length).toBe(4n);
    expect(neg.contains(-3n)).toBe(true);

    const big = new ClosedInterval(100_000_000_000_000n, 100_000_000_000_010n);
    expect(big.length).toBe(11n);
    expect(big.contains(100_000_000_000_005n)).toBe(true);
  });

  it('rejects inverted endpoints with RangeError', () => {
    expect(() => new ClosedInterval(10n, 9n)).toThrow(RangeError);
  });

  it('checks interval containment, overlaps, and intersections across symmetric cases', () => {
    const outer = new ClosedInterval(2n, 10n);
    const inner = new ClosedInterval(4n, 8n);
    const rightOverlap = new ClosedInterval(7n, 15n);
    const touching = new ClosedInterval(10n, 12n);
    const disjointRight = new ClosedInterval(11n, 14n);
    const disjointLeft = new ClosedInterval(-5n, 1n);

    expect(outer.containsInterval(inner)).toBe(true);
    expect(outer.containsInterval(outer)).toBe(true);
    expect(inner.containsInterval(outer)).toBe(false);
    expect(outer.containsInterval(rightOverlap)).toBe(false);

    expect(outer.overlaps(inner)).toBe(true);
    expect(outer.overlaps(rightOverlap)).toBe(true);
    expect(outer.overlaps(touching)).toBe(true);
    expect(outer.overlaps(disjointRight)).toBe(false);
    expect(outer.overlaps(disjointLeft)).toBe(false);

    expect(outer.intersection(inner)).toEqual(new ClosedInterval(4n, 8n));
    expect(inner.intersection(outer)).toEqual(new ClosedInterval(4n, 8n));
    expect(outer.intersection(rightOverlap)).toEqual(new ClosedInterval(7n, 10n));
    expect(rightOverlap.intersection(outer)).toEqual(new ClosedInterval(7n, 10n));
    expect(outer.intersection(touching)).toEqual(new ClosedInterval(10n, 10n));
    expect(outer.intersection(disjointRight)).toBeNull();
    expect(outer.intersection(disjointLeft)).toBeNull();
  });

  it('subtracts disjoint, covering, left-trimming, right-trimming, and interior intervals', () => {
    const base = new ClosedInterval(10n, 20n);

    const disjoint = base.subtract(new ClosedInterval(25n, 30n));
    expect(Object.isFrozen(disjoint)).toBe(true);
    expect(disjoint).toEqual([base]);

    const covered = base.subtract(new ClosedInterval(10n, 20n));
    expect(Object.isFrozen(covered)).toBe(true);
    expect(covered).toEqual([]);
    expect(base.subtract(new ClosedInterval(5n, 25n))).toEqual([]);

    const leftTrimmed = base.subtract(new ClosedInterval(5n, 14n));
    expect(leftTrimmed).toEqual([new ClosedInterval(15n, 20n)]);

    const rightTrimmed = base.subtract(new ClosedInterval(16n, 25n));
    expect(rightTrimmed).toEqual([new ClosedInterval(10n, 15n)]);

    const split = base.subtract(new ClosedInterval(13n, 17n));
    expect(Object.isFrozen(split)).toBe(true);
    expect(split).toEqual([new ClosedInterval(10n, 12n), new ClosedInterval(18n, 20n)]);
  });
});

describe('IntervalUnion', () => {
  it('handles empty union and freezes instances and interval arrays', () => {
    const empty = new IntervalUnion([]);
    expect(empty.intervals).toEqual([]);
    expect(empty.totalLength).toBe(0n);
    expect(empty.findContaining(0n)).toBeUndefined();
    expect(empty.contains(0n)).toBe(false);
    expect(Object.isFrozen(empty)).toBe(true);
    expect(Object.isFrozen(empty.intervals)).toBe(true);
  });

  it('sorts and coalesces overlapping, adjacent, nested, duplicate, and singleton ties', () => {
    const union = new IntervalUnion(
      new Set([
        new ClosedInterval(16n, 20n),
        new ClosedInterval(12n, 18n),
        new ClosedInterval(10n, 14n),
        new ClosedInterval(3n, 5n),
        new ClosedInterval(6n, 7n),
        new ClosedInterval(12n, 15n),
        new ClosedInterval(12n, 18n),
        new ClosedInterval(30n, 30n),
        new ClosedInterval(30n, 30n),
      ]),
    );

    expect(union.intervals.map((iv) => [iv.start, iv.end])).toEqual([
      [3n, 7n],
      [10n, 20n],
      [30n, 30n],
    ]);
    expect(union.totalLength).toBe(17n);
    expect(Object.isFrozen(union.intervals)).toBe(true);
  });

  it('binary-searches hits and misses across multiple disjoint bands', () => {
    const union = new IntervalUnion([
      new ClosedInterval(10n, 12n),
      new ClosedInterval(20n, 25n),
      new ClosedInterval(40n, 40n),
      new ClosedInterval(100_000_000_000_000n, 100_000_000_000_002n),
    ]);

    expect(union.findContaining(9n)).toBeUndefined();
    expect(union.findContaining(11n)).toEqual(new ClosedInterval(10n, 12n));
    expect(union.findContaining(15n)).toBeUndefined();
    expect(union.findContaining(20n)).toEqual(new ClosedInterval(20n, 25n));
    expect(union.findContaining(30n)).toBeUndefined();
    expect(union.contains(40n)).toBe(true);
    expect(union.contains(41n)).toBe(false);
    expect(union.contains(100_000_000_000_001n)).toBe(true);
    expect(union.contains(100_000_000_000_003n)).toBe(false);
  });
});
