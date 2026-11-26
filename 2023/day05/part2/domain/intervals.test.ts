import { describe, expect, it } from 'vitest';
import { ClosedInterval, IntervalUnion } from '../../../../shared/core';
import { RangeMap, RangeRule } from '../../shared';
import {
  FlowRibbon,
  mapIntervalUnion,
  parseSeedRanges,
  splitIntervalByMap,
  splitUnionByMap,
} from './intervals';

describe('FlowRibbon', () => {
  it('computes destination, delta, and isIdentity for a matched rule with non-zero delta', () => {
    const rule = RangeRule.fromTriple(52n, 50n, 48n);
    const ribbon = new FlowRibbon(new ClosedInterval(55n, 67n), rule);
    expect(Object.isFrozen(ribbon)).toBe(true);
    expect(ribbon.isIdentity).toBe(false);
    expect(ribbon.delta).toBe(2n);
    expect(ribbon.destination.start).toBe(57n);
    expect(ribbon.destination.end).toBe(69n);
  });

  it('computes destination, delta, and isIdentity for a matched rule with zero delta', () => {
    const rule = RangeRule.fromTriple(10n, 10n, 5n);
    const ribbon = new FlowRibbon(new ClosedInterval(11n, 13n), rule);
    expect(ribbon.isIdentity).toBe(false);
    expect(ribbon.delta).toBe(0n);
    expect(ribbon.destination.start).toBe(11n);
    expect(ribbon.destination.end).toBe(13n);
  });

  it('computes destination, delta, and isIdentity for an unmatched identity ribbon', () => {
    const src = new ClosedInterval(10n, 20n);
    const ribbon = new FlowRibbon(src, undefined);
    expect(ribbon.isIdentity).toBe(true);
    expect(ribbon.delta).toBe(0n);
    expect(ribbon.destination).toBe(src);
  });

  it('rejects source intervals overhanging left or right of the matched rule', () => {
    const rule = RangeRule.fromTriple(50n, 10n, 5n);
    expect(() => new FlowRibbon(new ClosedInterval(9n, 12n), rule)).toThrow(RangeError);
    expect(() => new FlowRibbon(new ClosedInterval(12n, 15n), rule)).toThrow(RangeError);
  });
});

describe('parseSeedRanges', () => {
  it('parses unsorted, overlapping, touching, 0n, and length=1n seed pairs into a normalized union', () => {
    const union = parseSeedRanges([10n, 3n, 0n, 1n, 5n, 5n, 6n, 2n]);
    expect(union.intervals.map((iv) => [iv.start, iv.end])).toEqual([
      [0n, 0n],
      [5n, 12n],
    ]);
  });

  it('rejects empty, odd-length, negative-start, and non-positive-length seed lists', () => {
    expect(() => parseSeedRanges([])).toThrow(RangeError);
    expect(() => parseSeedRanges([1n, 2n, 3n])).toThrow(RangeError);
    expect(() => parseSeedRanges([-1n, 3n])).toThrow(RangeError);
    expect(() => parseSeedRanges([5n, 0n])).toThrow(RangeError);
    expect(() => parseSeedRanges([5n, -2n])).toThrow(RangeError);
  });
});

describe('splitIntervalByMap / splitUnionByMap / mapIntervalUnion', () => {
  const map = new RangeMap('seed', 'soil', [
    RangeRule.fromTriple(100n, 10n, 5n), // [10, 14] -> +90 => [100, 104]
    RangeRule.fromTriple(15n, 15n, 3n),  // [15, 17] -> +0  => [15, 17]
    RangeRule.fromTriple(0n, 20n, 5n),   // [20, 24] -> -20 => [0, 4]
  ]);

  it('handles intervals strictly before first rule, strictly after last rule, and strictly inside a rule', () => {
    const before = splitIntervalByMap(new ClosedInterval(2n, 6n), map);
    expect(before.map((r) => [r.source.start, r.source.end, r.isIdentity])).toEqual([[2n, 6n, true]]);

    const after = splitIntervalByMap(new ClosedInterval(30n, 35n), map);
    expect(after.map((r) => [r.source.start, r.source.end, r.isIdentity])).toEqual([[30n, 35n, true]]);

    const inside = splitIntervalByMap(new ClosedInterval(11n, 13n), map);
    expect(inside.map((r) => [r.source.start, r.source.end, r.delta, r.isIdentity])).toEqual([
      [11n, 13n, 90n, false],
    ]);
  });

  it('matches two disjoint intervals inside the same wide rule', () => {
    const wideMap = new RangeMap('a', 'b', [RangeRule.fromTriple(1000n, 10n, 20n)]);
    const union = new IntervalUnion([new ClosedInterval(11n, 12n), new ClosedInterval(25n, 27n)]);
    const ribbons = splitUnionByMap(union, wideMap);
    expect(ribbons.map((r) => [r.source.start, r.source.end, r.destination.start, r.destination.end])).toEqual([
      [11n, 12n, 1001n, 1002n],
      [25n, 27n, 1015n, 1017n],
    ]);
  });

  it('handles exact rule boundaries, left+right overhangs, gaps, adjacent rules, and 1-element intervals', () => {
    const exact = splitIntervalByMap(new ClosedInterval(10n, 14n), map);
    expect(exact.map((r) => [r.destination.start, r.destination.end, r.isIdentity])).toEqual([
      [100n, 104n, false],
    ]);

    const spanAll = splitIntervalByMap(new ClosedInterval(8n, 26n), map);
    expect(
      spanAll.map((r) => [r.source.start, r.source.end, r.destination.start, r.destination.end, r.isIdentity]),
    ).toEqual([
      [8n, 9n, 8n, 9n, true],
      [10n, 14n, 100n, 104n, false],
      [15n, 17n, 15n, 17n, false],
      [18n, 19n, 18n, 19n, true],
      [20n, 24n, 0n, 4n, false],
      [25n, 26n, 25n, 26n, true],
    ]);

    const single = splitIntervalByMap(new ClosedInterval(10n, 10n), map);
    expect(single.map((r) => [r.destination.start, r.destination.end, r.isIdentity])).toEqual([
      [100n, 100n, false],
    ]);
  });

  it('coalesces touching and overlapping (non-injective) destination bands and handles empty unions', () => {
    const empty = new IntervalUnion([]);
    expect(splitUnionByMap(empty, map)).toEqual([]);
    expect(mapIntervalUnion(empty, map).intervals).toEqual([]);

    // [10, 12] -> [5, 7]; [18, 20] -> [6, 8] (overlaps); [25, 26] -> [9, 10] (touches)
    const nonInjectiveMap = new RangeMap('x', 'y', [
      RangeRule.fromTriple(5n, 10n, 3n),
      RangeRule.fromTriple(6n, 18n, 3n),
      RangeRule.fromTriple(9n, 25n, 2n),
    ]);
    const union = new IntervalUnion([
      new ClosedInterval(10n, 12n),
      new ClosedInterval(18n, 20n),
      new ClosedInterval(25n, 26n),
    ]);
    const mapped = mapIntervalUnion(union, nonInjectiveMap);
    expect(mapped.intervals.map((iv) => [iv.start, iv.end])).toEqual([[5n, 10n]]);
  });
});
