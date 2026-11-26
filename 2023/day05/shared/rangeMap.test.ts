import { describe, expect, it } from 'vitest';
import { ClosedInterval } from '../../../shared/core';
import { assertNonNegativeBigInt, RangeMap, RangeRule } from './rangeMap';

describe('assertNonNegativeBigInt', () => {
  it('accepts zero and positive bigints', () => {
    expect(assertNonNegativeBigInt(0n, 'seed')).toBe(0n);
    expect(assertNonNegativeBigInt(9_007_199_254_740_993n, 'seed')).toBe(9_007_199_254_740_993n);
  });

  it('rejects negative bigints with RangeError', () => {
    expect(() => assertNonNegativeBigInt(-1n, 'seed')).toThrow(RangeError);
  });
});

describe('RangeRule', () => {
  it('constructs via fromTriple with destStart first and sourceStart second', () => {
    const rule = RangeRule.fromTriple(50n, 98n, 2n);
    expect(rule.source.start).toBe(98n);
    expect(rule.source.end).toBe(99n);
    expect(rule.destStart).toBe(50n);
    expect(rule.delta).toBe(-48n);
    expect(rule.destination.start).toBe(50n);
    expect(rule.destination.end).toBe(51n);
    expect(Object.isFrozen(rule)).toBe(true);
  });

  it('supports positive, negative, and zero deltas, length 1, and >= 2^32 bounds', () => {
    const pos = RangeRule.fromTriple(100n, 10n, 1n);
    expect(pos.delta).toBe(90n);
    expect(pos.apply(10n)).toBe(100n);

    const zero = RangeRule.fromTriple(5n, 5n, 3n);
    expect(zero.delta).toBe(0n);
    expect(zero.apply(6n)).toBe(6n);

    const largeBase = 1n << 40n;
    const large = RangeRule.fromTriple(largeBase + 7n, largeBase, 5n);
    expect(large.apply(largeBase + 4n)).toBe(largeBase + 11n);
    expect(large.destination.end).toBe(largeBase + 11n);
  });

  it('rejects out-of-range apply values and invalid construction bounds', () => {
    const rule = RangeRule.fromTriple(50n, 98n, 2n);
    expect(() => rule.apply(97n)).toThrow(RangeError);
    expect(() => rule.apply(100n)).toThrow(RangeError);
    expect(() => RangeRule.fromTriple(0n, 5n, 0n)).toThrow(RangeError);
    expect(() => RangeRule.fromTriple(0n, 5n, -3n)).toThrow(RangeError);
    expect(() => new RangeRule(new ClosedInterval(-1n, 2n), 0n)).toThrow(RangeError);
    expect(() => new RangeRule(new ClosedInterval(0n, 2n), -1n)).toThrow(RangeError);
  });
});

describe('RangeMap', () => {
  it('sorts rules by source.start, accepts touching intervals, and binary-searches values', () => {
    const r3 = RangeRule.fromTriple(100n, 50n, 10n); // [50, 59] -> [100, 109]
    const r1 = RangeRule.fromTriple(20n, 5n, 5n); // [5, 9] -> [20, 24]
    const r2 = RangeRule.fromTriple(30n, 10n, 5n); // [10, 14] -> [30, 34] (touches r1)
    const map = new RangeMap('seed', 'soil', [r3, r1, r2]);

    expect(Object.isFrozen(map)).toBe(true);
    expect(Object.isFrozen(map.rules)).toBe(true);
    expect(map.rules.map((r) => r.source.start)).toEqual([5n, 10n, 50n]);

    expect(map.findRule(0n)).toBeUndefined();
    expect(map.mapValue(0n)).toBe(0n);
    expect(map.findRule(5n)).toBe(r1);
    expect(map.mapValue(9n)).toBe(24n);
    expect(map.findRule(12n)).toBe(r2);
    expect(map.mapValue(12n)).toBe(32n);
    expect(map.findRule(30n)).toBeUndefined();
    expect(map.mapValue(30n)).toBe(30n);
    expect(map.findRule(59n)).toBe(r3);
    expect(map.mapValue(59n)).toBe(109n);
    expect(map.findRule(60n)).toBeUndefined();
    expect(map.mapValue(60n)).toBe(60n);
  });

  it('rejects invalid categories, empty rules, and overlapping rules (including identical source.start)', () => {
    const r1 = RangeRule.fromTriple(10n, 5n, 4n); // [5, 8]
    const rOverlap = RangeRule.fromTriple(20n, 8n, 2n); // [8, 9]
    const rSameStart = RangeRule.fromTriple(30n, 5n, 2n); // [5, 6]

    expect(() => new RangeMap('', 'soil', [r1])).toThrow(RangeError);
    expect(() => new RangeMap('seed-1', 'soil', [r1])).toThrow(RangeError);
    expect(() => new RangeMap('seed', 'soil!', [r1])).toThrow(RangeError);
    expect(() => new RangeMap('seed', 'soil', [])).toThrow(RangeError);
    expect(() => new RangeMap('seed', 'soil', [r1, rOverlap])).toThrow(RangeError);
    expect(() => new RangeMap('seed', 'soil', [r1, rSameStart])).toThrow(RangeError);
  });
});
